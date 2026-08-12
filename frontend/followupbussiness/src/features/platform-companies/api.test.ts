import { afterEach, expect, test, vi } from "vitest";
import { clearSession, login } from "../auth/auth";
import { changeCompanyStatus, createCompany, listCompanies, listCompanyAdminInvitations, provisionInitialAdmin } from "./api";

afterEach(() => {
  clearSession();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("envía el payload contractual exacto al crear una empresa", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "company-1",
          legalName: "Nova",
          code: "NOVA",
          settings: { timezone: "America/Lima" },
          status: "ACTIVE",
        }),
        { status: 201 },
      ),
    );
  vi.stubGlobal("fetch", fetchMock);
  await createCompany({
    legalName: "Nova",
    tradeName: "Nova SAC",
    taxId: "201",
    timezone: "America/Lima",
    currency: "PEN",
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/platform/companies",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        legalName: "Nova",
        tradeName: "Nova SAC",
        taxId: "201",
        settings: {
          timezone: "America/Lima",
          currency: "PEN",
          geofenceRadiusMeters: 100,
          trackingIntervalSeconds: 60,
        },
      }),
    }),
  );
});

test("incluye la prueba CSRF de la sesión al crear una empresa", async () => {
  const loginResponse = {
    channel: "WEB",
    credentials: {
      accessToken: "access-token",
      tokenType: "Bearer",
      expiresIn: 600,
    },
    csrfToken: "c".repeat(43),
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      displayName: "Plataforma",
      email: "platform@example.com",
      status: "ACTIVE",
      roles: ["PLATFORM_SUPERADMIN"],
      company: null,
    },
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(loginResponse), { status: 200 }),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify(loginResponse.user), { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);

  await login({
    identifier: "platform@example.com",
    password: "correct-password",
  });
  await createCompany({
    legalName: "Nova",
    timezone: "America/Lima",
    currency: "PEN",
  });

  expect(fetchMock.mock.calls[2]).toEqual([
    "/api/platform/companies",
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: "Bearer access-token",
        "X-CSRF-Token": "c".repeat(43),
      }),
    }),
  ]);
});

test("lista con búsqueda/filtro y provisiona sin rol ni datos sensibles", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "company-1",
              legalName: "Nova",
              code: "NOVA",
              settings: { timezone: "America/Lima" },
              status: "ACTIVE",
            },
          ],
          page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(new Response(null, { status: 202 }));
  vi.stubGlobal("fetch", fetchMock);
  const result = await listCompanies({
    page: 0,
    pageSize: 20,
    search: "Nova",
    status: "ACTIVE",
  });
  await provisionInitialAdmin("company/1", {
    displayName: "Ana",
    email: "ana@example.com",
    username: "ana",
  });
  expect(fetchMock.mock.calls[0]?.[0]).toBe(
    "/api/platform/companies?page=0&pageSize=20&search=Nova&status=ACTIVE",
  );
  expect(result.page).toEqual({
    items: [
      {
        id: "company-1",
        legalName: "Nova",
        tradeName: null,
        code: "NOVA",
        timezone: "America/Lima",
        status: "ACTIVE",
      },
    ],
    page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
  });
  expect(fetchMock).toHaveBeenLastCalledWith(
    "/api/platform/companies/company%2F1/initial-admin",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        displayName: "Ana",
        email: "ana@example.com",
        username: "ana",
      }),
    }),
  );
});

test("lista estados de administradores sin exponer credenciales", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
    id: "admin-1", displayName: "Ana", email: "ana@example.com",
    accountStatus: "INVITED", deliveryStatus: "PENDING",
    createdAt: "2026-08-11T00:00:00Z", deliveredAt: null, deliveryAttempts: 0,
  }]), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const result = await listCompanyAdminInvitations("company/1");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/platform/companies/company%2F1/admins",
    expect.objectContaining({ method: "GET" }),
  );
  expect(result.invitations).toEqual([expect.objectContaining({
    email: "ana@example.com", deliveryStatus: "PENDING",
  })]);
});

test("cambia el estado con el payload exacto y parsea únicamente la empresa confirmada", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    id: "company-1", legalName: "Nova", code: "NOVA",
    settings: { timezone: "America/Lima" }, status: "SUSPENDED",
  }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const result = await changeCompanyStatus("company/1", {
    status: "SUSPENDED",
    reason: "Incumplimiento operativo",
  });

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/platform/companies/company%2F1/status",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        status: "SUSPENDED",
        reason: "Incumplimiento operativo",
      }),
    }),
  );
  expect(result.company).toMatchObject({ id: "company-1", status: "SUSPENDED" });
});
