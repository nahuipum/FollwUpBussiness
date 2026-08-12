import { afterEach, expect, test, vi } from "vitest";
import {
  canAccessPath,
  clearSession,
  getSessionCompanyLabel,
  getSessionCompanyName,
  getSessionIdentity,
  login,
  logout,
  refreshSession,
  restoreSession,
  retryPendingLogout,
} from "./auth";
import { subscribeToApiErrors } from "../../lib/api";

const webResponse = {
  channel: "WEB",
  credentials: {
    accessToken: "access-token",
    tokenType: "Bearer",
    expiresIn: 600,
  },
  csrfToken: "c".repeat(43),
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    displayName: "Usuario de prueba",
    email: "user@example.com",
    status: "ACTIVE",
    roles: ["SELLER"],
    company: null,
  },
};

function currentUserResponse(user: unknown = webResponse.user) {
  return new Response(JSON.stringify(user), { status: 200 });
}

afterEach(() => {
  clearSession();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test("keeps the WEB login request on Vite even with an old backend URL", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me")
      ? currentUserResponse()
      : new Response(JSON.stringify(webResponse), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toEqual({ ok: true, redirectTo: "/seller/dashboard" });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/auth/login",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "X-Auth-Client": "WEB",
        "X-Client-Instance-Id": expect.any(String),
      }),
      body: JSON.stringify({
        identifier: "seller@example.com",
        password: "correct-password",
      }),
    }),
  );
});

test("uses /me as current source for company identity", async () => {
  const currentUser = {
    ...webResponse.user,
    company: { id: "company-1", legalName: "Empresa Ficticia" },
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
      .mockResolvedValueOnce(currentUserResponse(currentUser)),
  );

  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toMatchObject({ ok: true });

  expect(getSessionCompanyName()).toBe("Empresa Ficticia");
  expect(getSessionCompanyLabel()).toBe("Empresa Ficticia");
});

test("shortens only a long company label", async () => {
  const currentUser = {
    ...webResponse.user,
    company: {
      id: "company-1",
      legalName: "Distribuidora Nacional de Productos Andinos SAC",
    },
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
      .mockResolvedValueOnce(currentUserResponse(currentUser)),
  );

  await login({ identifier: "seller@example.com", password: "correct-password" });

  expect(getSessionCompanyName()).toBe(currentUser.company.legalName);
  expect(getSessionCompanyLabel()).toBe("Distribuidora");
});

test("fails safely when the response is semantically invalid", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "http://backend.test");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ channel: "WEB" }), { status: 200 }),
  );
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toMatchObject({ ok: false });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/login");
});

test("returns the generic error for an HTTP failure without exposing credentials", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
  );
  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toEqual({
    ok: false,
    message:
      "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.",
    retryAfterSeconds: null,
  });
});

test("renews WEB credentials once with the in-memory CSRF token", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
    .mockResolvedValueOnce(currentUserResponse())
    .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
    .mockResolvedValueOnce(currentUserResponse());
  vi.stubGlobal("fetch", fetchMock);

  await login({ identifier: "seller@example.com", password: "correct-password" });
  await expect(Promise.all([refreshSession(), refreshSession()])).resolves.toEqual([
    "refreshed",
    "refreshed",
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(fetchMock.mock.calls[2]).toEqual([
    "/api/auth/refresh",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({
        "X-Auth-Client": "WEB",
        "X-CSRF-Token": "c".repeat(43),
      }),
    }),
  ]);
});

test("restores a WEB session after reload using only the per-tab CSRF value", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
    .mockResolvedValueOnce(currentUserResponse());
  vi.stubGlobal("fetch", fetchMock);

  await expect(restoreSession()).resolves.toBe("refreshed");
  expect(canAccessPath("/seller/dashboard")).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/auth/refresh",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({
        "X-Auth-Client": "WEB",
        "X-CSRF-Token": "c".repeat(43),
      }),
    }),
  );
});

test("uses one refresh request when restoration is triggered twice", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  let resolveResponse: (response: Response) => void = () => undefined;
  const response = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });
  const fetchMock = vi
    .fn()
    .mockReturnValueOnce(response)
    .mockResolvedValueOnce(currentUserResponse());
  vi.stubGlobal("fetch", fetchMock);

  const first = restoreSession();
  const second = restoreSession();
  resolveResponse(new Response(JSON.stringify(webResponse), { status: 200 }));

  await expect(Promise.all([first, second])).resolves.toEqual([
    "refreshed",
    "refreshed",
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test.each([401, 403, 409])(
  "clears local access and roles when refresh is terminal (%i)",
  async (status) => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response(null, { status })),
    );
    await login({ identifier: "seller@example.com", password: "correct-password" });

    await expect(refreshSession()).resolves.toBe("expired");
    expect(canAccessPath("/seller/dashboard")).toBe(false);
  },
);

test("keeps an active session when renewal is temporarily unavailable", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
      .mockResolvedValueOnce(currentUserResponse())
      .mockResolvedValueOnce(new Response(null, { status: 503 })),
  );
  await login({ identifier: "seller@example.com", password: "correct-password" });

  await expect(refreshSession()).resolves.toBe("unavailable");
  expect(canAccessPath("/seller/dashboard")).toBe(true);
});

test("mantiene pendiente el logout 404 sin publicar un ErrorState global", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(webResponse), { status: 200 }))
      .mockResolvedValueOnce(currentUserResponse())
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 })),
  );
  const errors: number[] = [];
  const unsubscribe = subscribeToApiErrors((error) => errors.push(error.status));

  await login({ identifier: "seller@example.com", password: "correct-password" });
  await logout();
  await expect(retryPendingLogout()).resolves.toBe(false);
  await Promise.resolve();
  await Promise.resolve();

  expect(errors).toEqual([]);
  unsubscribe();
});

test("does not restore a late refresh after logout and a tenant-changing login", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  let resolveRefresh: ((response: Response) => void) | undefined;
  const lateRefresh = new Promise<Response>((resolve) => {
    resolveRefresh = resolve;
  });
  const tenantA = {
    ...webResponse,
    user: { ...webResponse.user, id: "seller-a", roles: ["SELLER"], company: "tenant-a" },
  };
  const tenantB = {
    ...webResponse,
    user: {
      ...webResponse.user,
      id: "admin-b",
      roles: ["COMPANY_ADMIN"],
      company: "tenant-b",
    },
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(tenantA), { status: 200 }))
      .mockResolvedValueOnce(currentUserResponse(tenantA.user))
      .mockReturnValueOnce(lateRefresh)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tenantB), { status: 200 }))
      .mockResolvedValueOnce(currentUserResponse(tenantB.user)),
  );

  await login({ identifier: "seller@example.com", password: "correct-password" });
  const refresh = refreshSession();
  await logout();
  await login({ identifier: "admin@example.com", password: "correct-password" });
  resolveRefresh?.(new Response(JSON.stringify(tenantA), { status: 200 }));

  await expect(refresh).resolves.toBe("superseded");
  expect(canAccessPath("/company/dashboard")).toBe(true);
  expect(canAccessPath("/seller/dashboard")).toBe(false);
  expect(getSessionIdentity()).toMatchObject({ id: "admin-b", company: "tenant-b" });
});
