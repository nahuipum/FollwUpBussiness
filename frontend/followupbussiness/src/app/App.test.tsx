import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";
import {
  canAccessPath,
  clearSession,
  getSessionIdentity,
  hasPendingLogout,
  hasSession,
  login,
  logout,
  retryPendingLogout,
} from "../features/auth/auth";
import { ApiRequestObsoleteError, apiRequest } from "../lib/api";

const webResponse = (role: string) => ({
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
    roles: [role],
    company: null,
  },
});

const currentUserResponse = (role: string) =>
  new Response(JSON.stringify(webResponse(role).user), { status: 200 });

const sellerPageResponse = () => new Response(JSON.stringify({
  items: [{ id: "seller-1", userId: "user-1", displayName: "Ana Vendedora", email: "ana@example.com", phone: null, employeeCode: "VEN-001", status: "ACTIVE", supervisorId: "supervisor-1", territoryIds: ["territory-1"], supervisor: { id: "supervisor-1", displayName: "Sofía Supervisora" }, territories: [{ id: "territory-1", code: "LIM", name: "Lima Centro" }], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 }],
  page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
}), { status: 200 });
const customerPageResponse = () => new Response(JSON.stringify({
  items: [{ id: "customer-1", name: "Comercial Norte", segment: "Mayorista", territoryId: null, assignedSellerIds: ["seller-1"], status: "ACTIVE", location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 }],
  page: { page: 0, pageSize: 5, totalElements: 1, totalPages: 1 },
}), { status: 200 });
const clientReferencePageResponse = () => new Response(JSON.stringify({ items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 0 } }), { status: 200 });

const tenantSellerPageResponse = (tenant: "a" | "b") => new Response(JSON.stringify({
  items: [{ id: `seller-${tenant}`, userId: `user-${tenant}`, displayName: `Vendedor tenant ${tenant}`, email: `tenant-${tenant}@example.test`, phone: "+51 900 000 000", employeeCode: `VEN-${tenant.toUpperCase()}`, status: "ACTIVE", supervisorId: null, territoryIds: [], supervisor: null, territories: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 }],
  page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
}), { status: 200 });

afterEach(() => {
  cleanup();
  clearSession();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  window.localStorage.removeItem("followupbusiness.logout-pending");
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
});

test("validates credentials before sending them", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

  expect(
    screen.getByText("Ingresa un correo electrónico o usuario válido."),
  ).toBeTruthy();
  expect(
    screen.getByText("La contraseña debe tener entre 8 y 200 caracteres."),
  ).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("keeps password hidden until explicitly requested", () => {
  render(<App />);
  const password = screen.getByLabelText("Contraseña");
  expect(password).toHaveProperty("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
  expect(password).toHaveProperty("type", "text");
});

test("uses WEB headers and redirects each contractual role", async () => {
  const roles = [
    ["PLATFORM_SUPERADMIN", "/platform/companies"],
    ["COMPANY_ADMIN", "/company/dashboard"],
    ["SUPERVISOR", "/supervisor/dashboard"],
    ["SELLER", "/seller/dashboard"],
  ] as const;

  for (const [role, expectedPath] of roles) {
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >((url) =>
      Promise.resolve(
        url.endsWith("/me")
          ? currentUserResponse(role)
          : new Response(JSON.stringify(webResponse(role)), { status: 200 }),
      ));
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<App />);
    fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
      target: { value: "seller@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    await waitFor(() => expect(window.location.pathname).toBe(expectedPath));
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: "include",
      headers: expect.objectContaining({ "X-Auth-Client": "WEB" }),
    });
    view.unmount();
    clearSession();
    window.history.replaceState({}, "", "/");
  }
});

test("shows the same generic error and clears the password after a failed login", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ code: "AUTHENTICATION_FAILED" }), {
          status: 401,
        }),
      ),
  );
  render(<App />);
  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: "seller@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  const submitButton = screen.getByRole("button", { name: "Iniciar sesión" });
  submitButton.focus();
  fireEvent.click(submitButton);

  const dialog = await screen.findByRole("dialog", {
    name: "Inicio de sesión fallido",
  });
  expect(dialog.textContent).toContain("No fue posible iniciar sesión");
  expect(screen.getByRole("button", { name: "Cerrar" })).toBe(
    document.activeElement,
  );
  expect(screen.getByLabelText("Contraseña")).toHaveProperty("value", "");

  fireEvent.keyDown(document, { key: "Escape" });
  expect(
    screen.queryByRole("dialog", { name: "Inicio de sesión fallido" }),
  ).toBeNull();
  expect(submitButton).toBe(document.activeElement);
});

test("honors Retry-After after a rate-limited response", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 429, headers: { "Retry-After": "60" } }),
      ),
  );
  render(<App />);
  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: "seller@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "espera 60 segundos",
    ),
  );
  expect(screen.getByRole("button", { name: "Iniciar sesión" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("closes a cookie-bearing invalid 200 without navigating or retaining a local session", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("UNTRUSTED_ROLE")), {
        status: 200,
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: "seller@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

  await waitFor(() =>
    expect(
      screen.getByRole("dialog", { name: "Inicio de sesión fallido" })
        .textContent,
    ).toContain(
      "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.",
    ),
  );
  expect(window.location.pathname).toBe("/");
  expect(hasSession()).toBe(false);
  expect(canAccessPath("/seller/dashboard")).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[1]).toEqual([
    "/api/auth/logout",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({
        "X-Auth-Client": "WEB",
        "X-Logout-Intent": "PENDING",
      }),
    }),
  ]);
  expect(hasPendingLogout()).toBe(false);
});

test("keeps local authentication closed when the pending cookie logout fails", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response("{malformed", { status: 200 }))
    .mockRejectedValueOnce(new Error("offline"));
  vi.stubGlobal("fetch", fetchMock);

  const result = await login({
    identifier: "seller@example.com",
    password: "correct-password",
  });

  expect(result).toEqual({
    ok: false,
    message:
      "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.",
    retryAfterSeconds: null,
  });
  expect(hasSession()).toBe(false);
  expect(canAccessPath("/seller/dashboard")).toBe(false);
  expect(hasPendingLogout()).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("segregates routes and revokes the session on logout", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER")), { status: 200 }),
    )
    .mockResolvedValueOnce(currentUserResponse("SELLER"))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await login({
    identifier: "seller@example.com",
    password: "correct-password",
  });
  expect(canAccessPath("/seller/dashboard")).toBe(true);
  expect(canAccessPath("/platform/companies")).toBe(false);
  await logout();

  expect(canAccessPath("/seller/dashboard")).toBe(false);
  expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
    credentials: "include",
    headers: expect.objectContaining({ "X-CSRF-Token": "c".repeat(43) }),
  });
  expect(hasPendingLogout()).toBe(false);
});

test("retries only a pending logout without keeping a renewable session", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER")), { status: 200 }),
    )
    .mockResolvedValueOnce(currentUserResponse("SELLER"))
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await login({
    identifier: "seller@example.com",
    password: "correct-password",
  });
  await logout();
  expect(hasPendingLogout()).toBe(true);
  expect(canAccessPath("/seller/dashboard")).toBe(false);
  await expect(retryPendingLogout()).resolves.toBe(true);
  expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
    headers: expect.objectContaining({ "X-Logout-Intent": "PENDING" }),
  });
  expect(hasPendingLogout()).toBe(false);
});

test("redirects once to login after a terminal scheduled refresh", async () => {
  vi.useFakeTimers();
  window.history.replaceState({}, "", "/seller/dashboard");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER")), { status: 200 }),
    )
    .mockResolvedValueOnce(currentUserResponse("SELLER"))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  await login({
    identifier: "seller@example.com",
    password: "correct-password",
  });

  render(<App />);
  await vi.advanceTimersByTimeAsync(599_000);

  expect(window.location.pathname).toBe("/");
  expect(hasSession()).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test("restores the protected route after a reload before rendering its panel", async () => {
  window.history.replaceState({}, "", "/seller/dashboard");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER")), { status: 200 }),
    )
    .mockResolvedValueOnce(currentUserResponse("SELLER"));
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  await waitFor(() =>
    expect(screen.getByText("Sesión iniciada")).toBeTruthy(),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/auth/refresh",
    expect.objectContaining({
      headers: expect.objectContaining({ "X-CSRF-Token": "c".repeat(43) }),
    }),
  );
  expect(screen.queryByRole("dialog", { name: "Tu sesión terminó" })).toBeNull();
});

test("restaura sesión al recargar Configuración", async () => {
  window.history.replaceState({}, "", "/company/settings");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me")
      ? currentUserResponse("COMPANY_ADMIN")
      : url.endsWith("/company/settings")
        ? new Response(JSON.stringify({ timezone: "America/Lima", currency: "PEN", geofenceRadiusMeters: 100, trackingIntervalSeconds: 60, locationRetentionDays: 90, saleEditWindowMinutes: null }), { status: 200, headers: { ETag: "\"7\"" } })
        : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  await screen.findByRole("heading", { name: "Configuración" });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/refresh");
  expect(screen.queryByRole("dialog", { name: "Tu sesión terminó" })).toBeNull();
});

test("restaura sesión al recargar directamente el mapa general de clientes", async () => {
  window.history.replaceState({}, "", "/company/clients/map");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? currentUserResponse("COMPANY_ADMIN")
      : url.includes("/customers?") ? customerPageResponse()
        : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  await screen.findByRole("heading", { name: "Mapa general de clientes" });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/refresh");
  expect(screen.queryByText("Inicia sesión para continuar")).toBeNull();
});

test("restaura sesión al recargar la carga de clientes", async () => {
  window.history.replaceState({}, "", "/company/customer-imports");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? currentUserResponse("COMPANY_ADMIN")
      : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  await screen.findByRole("heading", { name: "Carga de clientes" });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/refresh");
  expect(screen.queryByText("Inicia sesión para continuar")).toBeNull();
});

test("restaura sesión al recargar un resultado de importación autorizado", async () => {
  const importId = "00000000-0000-4000-8000-000000000013";
  window.history.replaceState({}, "", `/company/customer-imports/${importId}`);
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const job = { id: importId, status: "COMPLETED", totalRows: 1, acceptedRows: 1, rejectedRows: 0, createdAt: "2026-08-24T10:00:00Z", completedAt: "2026-08-24T10:01:00Z", errorFileExpiresAt: null };
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? currentUserResponse("COMPANY_ADMIN")
      : url.includes(`/customer-imports/${importId}`) ? new Response(JSON.stringify(job), { status: 200 })
        : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  await screen.findByRole("heading", { name: "Resultado de importación" });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/refresh");
  expect(screen.queryByText("Inicia sesión para continuar")).toBeNull();
});

test("restaura la ruta directa de Asignar cartera sólo para administrador", async () => {
  window.history.replaceState({}, "", "/company/customer-assignments");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? currentUserResponse("COMPANY_ADMIN")
      : url.includes("/customers?") ? customerPageResponse()
        : url.includes("/sellers?") || url.includes("/territories?") ? new Response(JSON.stringify({ items: [], page: { page: 0, pageSize: 200, totalElements: 0, totalPages: 1 } }), { status: 200 })
          : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  await screen.findByRole("heading", { name: "Asignar cartera" });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/refresh");
});

test.each(["SUPERVISOR", "SELLER"] as const)("deniega Asignar cartera a %s", async (role) => {
  vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(url.endsWith("/me") ? currentUserResponse(role) : new Response(JSON.stringify(webResponse(role)), { status: 200 }))));
  await login({ identifier: `${role.toLowerCase()}@example.com`, password: "correct-password" });
  window.history.replaceState({}, "", "/company/customer-assignments");
  render(<App />);
  expect(await screen.findByText("Inicia sesión para continuar")).toBeTruthy();
  cleanup();
});

test("does not show a session-restoration screen or load companies during a protected reload", async () => {
  window.history.replaceState({}, "", "/platform/companies");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  let resolveRefresh: (response: Response) => void = () => undefined;
  const refresh = new Promise<Response>((resolve) => {
    resolveRefresh = resolve;
  });
  const fetchMock = vi.fn().mockReturnValueOnce(refresh);
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  expect(screen.queryByText("Estamos restaurando tu sesión")).toBeNull();
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/refresh");

  resolveRefresh(new Response(null, { status: 401 }));

  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Tu sesión terminó" })).toBeTruthy(),
  );
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/platform/companies"))).toBe(false);
});

test("muestra el sidebar y un contenido vacío en el dashboard de plataforma", async () => {
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me")
      ? currentUserResponse("PLATFORM_SUPERADMIN")
      : new Response(JSON.stringify(webResponse("PLATFORM_SUPERADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "platform@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/platform/dashboard");

  render(<App />);

  await waitFor(() => expect(screen.getByRole("navigation")).toBeTruthy());
  expect(screen.getByRole("button", { name: "Resumen" }).className).toContain("dashboard-nav__item--active");
  expect(screen.getByLabelText("Contenido del panel de plataforma").childElementCount).toBe(0);
  expect(screen.queryByText("Sesión iniciada")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Empresas" })).toBeNull();
});

test("ubica Clientes entre usuarios y auditoría en dashboard de empresa", async () => {
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me")
      ? currentUserResponse("COMPANY_ADMIN")
      : url.includes("/sellers?")
        ? sellerPageResponse()
      : url.includes("/customers?")
        ? customerPageResponse()
      : url.includes("/territories?")
        ? clientReferencePageResponse()
      : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "admin@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/company/dashboard");

  render(<App />);

  await waitFor(() => expect(screen.getByRole("navigation")).toBeTruthy());
  const items = Array.from(screen.getByRole("navigation").querySelectorAll("button")).map((item) => item.textContent);
  expect(items).toEqual(["Resumen", "Administradores y supervisores", "Vendedores", "Zonas", "Clientes", "Asignar cartera", "Auditoría", "Configuración"]);
  fireEvent.click(screen.getByRole("button", { name: "Vendedores" }));
  expect(window.location.pathname).toBe("/company/sellers");
  expect(screen.getByRole("button", { name: "Vendedores" }).className).toContain("dashboard-nav__item--active");
  expect(screen.getByRole("heading", { name: "Vendedores" })).toBeTruthy();
  await screen.findByText("Ana Vendedora");
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana Vendedora" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Ver detalle" }));
  expect(screen.getByRole("dialog", { name: "Detalle de vendedor" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
  fireEvent.click(screen.getByRole("button", { name: "Gestión de clientes" }));
  expect(window.location.pathname).toBe("/company/clients");
  expect(screen.getByRole("button", { name: "Clientes" }).className).toContain("dashboard-nav__item--active");
  expect(screen.getByRole("heading", { name: "Clientes" })).toBeTruthy();
  await screen.findByText("Comercial Norte");
  expect(screen.getByRole("table", { name: "Clientes" })).toBeTruthy();
});

test("muestra el listado contractual al supervisor sin abrir navegación administrativa", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me")
      ? currentUserResponse("SUPERVISOR")
      : url.includes("/sellers?")
        ? sellerPageResponse()
      : url.includes("/customers?")
        ? customerPageResponse()
      : url.includes("/territories?")
        ? clientReferencePageResponse()
      : new Response(JSON.stringify(webResponse("SUPERVISOR")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "supervisor@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/supervisor/dashboard");

  render(<App />);

  await waitFor(() => expect(screen.getByRole("navigation")).toBeTruthy());
  expect(screen.getByRole("button", { name: "Resumen" }).className).toContain("dashboard-nav__item--active");
  expect(screen.getByLabelText("Contenido del dashboard principal de supervisor").childElementCount).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Vendedores" }));
  expect(window.location.pathname).toBe("/supervisor/sellers");
  expect(screen.getByRole("button", { name: "Vendedores" }).className).toContain("dashboard-nav__item--active");
  await screen.findByText("Ana Vendedora");
  expect(screen.getByRole("table", { name: "Vendedores" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Administradores y supervisores" })).toBeNull();
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/sellers?page=0&pageSize=5"))).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
  fireEvent.click(screen.getByRole("button", { name: "Gestión de clientes" }));
  await screen.findByText("Comercial Norte");
  expect(window.location.pathname).toBe("/supervisor/clients");
  fireEvent.click(screen.getByRole("button", { name: "Mapa general" }));
  await screen.findByRole("heading", { name: "Mapa general de clientes" });
  expect(window.location.pathname).toBe("/supervisor/clients/map");
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/customers?"))).toBe(true);
});

test("restringe el mapa general a administración y consulta sólo clientes", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? currentUserResponse("COMPANY_ADMIN")
      : url.includes("/customers?") ? customerPageResponse()
        : new Response(JSON.stringify(webResponse("COMPANY_ADMIN")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "admin@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/company/clients/map");
  render(<App />);

  await screen.findByText("Comercial Norte");
  expect(screen.getByRole("heading", { name: "Mapa general de clientes" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Gestión de clientes" })).toBeTruthy();
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/territories?"))).toBe(false);
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/sellers?"))).toBe(false);
});

test("muestra un vacío claro al supervisor en su mapa sin consultar opciones ajenas", async () => {
  const emptyCustomers = new Response(JSON.stringify({ items: [], page: { page: 0, pageSize: 200, totalElements: 0, totalPages: 0 } }), { status: 200 });
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? currentUserResponse("SUPERVISOR")
      : url.includes("/customers?") ? emptyCustomers.clone()
        : new Response(JSON.stringify(webResponse("SUPERVISOR")), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "supervisor@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/supervisor/clients/map");
  render(<App />);
  expect(await screen.findByText("No hay clientes disponibles para tu equipo en este momento.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Mapa general" })).toBeTruthy();
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/territories?"))).toBe(false);
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/sellers?"))).toBe(false);
});

test("descarta los clientes del contexto anterior al reemplazar la sesión en el mapa", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  let tenant: "a" | "b" = "a";
  const sessionFor = (value: "a" | "b") => ({
    ...webResponse("COMPANY_ADMIN"),
    user: { ...webResponse("COMPANY_ADMIN").user, id: `admin-${value}`, company: { id: `tenant-${value}`, legalName: `Empresa ${value}` } },
  });
  const customersFor = (value: "a" | "b") => new Response(JSON.stringify({
    items: [{ id: `customer-${value}`, name: `Cliente ${value}`, segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE", location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 }],
    page: { page: 0, pageSize: 200, totalElements: 1, totalPages: 1 },
  }), { status: 200 });
  vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me") ? new Response(JSON.stringify(sessionFor(tenant).user), { status: 200 })
      : url.includes("/customers?") ? customersFor(tenant)
        : new Response(JSON.stringify(sessionFor(tenant)), { status: 200 }),
  )));
  await login({ identifier: "admin-a@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/company/clients/map");
  render(<App />);

  await screen.findByText("Cliente a");
  tenant = "b";
  await login({ identifier: "admin-b@example.com", password: "correct-password" });

  await screen.findByText("Cliente b");
  expect(screen.queryByText("Cliente a")).toBeNull();
});

test("no habilita mapas de clientes a vendedor ni plataforma", async () => {
  for (const role of ["SELLER", "PLATFORM_SUPERADMIN"] as const) {
    const fetchMock = vi.fn((url: string) => Promise.resolve(url.endsWith("/me") ? currentUserResponse(role) : new Response(JSON.stringify(webResponse(role)), { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);
    await login({ identifier: `${role.toLowerCase()}@example.com`, password: "correct-password" });
    window.history.replaceState({}, "", role === "SELLER" ? "/supervisor/clients/map" : "/company/clients/map");
    render(<App />);
    expect(await screen.findByText("Inicia sesión para continuar")).toBeTruthy();
    cleanup();
  }
});

test("revoca el detalle del tenant anterior al reemplazar la sesión", async () => {
  let activeTenant: "a" | "b" = "a";
  const tenantResponse = (tenant: "a" | "b") => ({
    ...webResponse("COMPANY_ADMIN"),
    user: { ...webResponse("COMPANY_ADMIN").user, id: `admin-${tenant}`, company: { id: `tenant-${tenant}`, legalName: `Empresa ${tenant}` } },
  });
  const fetchMock = vi.fn((url: string) => Promise.resolve(
    url.endsWith("/me")
      ? new Response(JSON.stringify(tenantResponse(activeTenant).user), { status: 200 })
      : url.includes("/sellers?")
        ? tenantSellerPageResponse(activeTenant)
        : new Response(JSON.stringify(tenantResponse(activeTenant)), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "admin-a@example.test", password: "correct-password" });
  window.history.replaceState({}, "", "/company/sellers");
  render(<App />);

  await screen.findByText("Vendedor tenant a");
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Vendedor tenant a" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Ver detalle" }));
  expect(screen.getByRole("dialog").textContent).toContain("tenant-a@example.test");

  activeTenant = "b";
  await login({ identifier: "admin-b@example.test", password: "correct-password" });
  await waitFor(() => expect(screen.queryAllByText("tenant-a@example.test")).toHaveLength(0));
  await screen.findByText("Vendedor tenant b");
  expect(screen.queryByText("Vendedor tenant a")).toBeNull();
  expect(screen.queryByText("VEN-A")).toBeNull();
});

test("explains an expired session on a protected reload and redirects to login", async () => {
  window.history.replaceState({}, "", "/seller/dashboard");
  render(<App />);

  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Tu sesión terminó" })).toBeTruthy(),
  );
  expect(screen.getByText(/Tu sesión expiró, fue revocada/i)).toBeTruthy();
  expect(window.location.pathname).toBe("/");
  fireEvent.click(screen.getByRole("button", { name: "Ir al inicio de sesión" }));
  expect(screen.queryByRole("dialog", { name: "Tu sesión terminó" })).toBeNull();
});

test("shows the shared renewal dialog when a protected reload cannot be renewed", async () => {
  window.history.replaceState({}, "", "/seller/dashboard");
  window.sessionStorage.setItem("followupbusiness.csrf-token", "c".repeat(43));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

  render(<App />);

  await waitFor(() =>
    expect(
      screen.getByRole("dialog", { name: "No pudimos renovar tu sesión" }),
    ).toBeTruthy(),
  );
  expect(screen.getByText(/No pudimos verificar tu sesión/i)).toBeTruthy();
  expect(window.location.pathname).toBe("/");
});

test("clears one active session and shows the expired-session flow after an API 401", async () => {
  window.history.replaceState({}, "", "/seller/dashboard");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER")), { status: 200 }),
    )
    .mockResolvedValueOnce(currentUserResponse("SELLER"))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ correlationId: "00000000-0000-4000-8000-000000000401" }), { status: 401 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "seller@example.com", password: "correct-password" });
  render(<App />);

  await apiRequest("/protected-resource", { method: "GET" });

  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Tu sesión terminó" })).toBeTruthy(),
  );
  expect(screen.getByText("Correlation ID: 00000000-0000-4000-8000-000000000401")).toBeTruthy();
  expect(hasSession()).toBe(false);
  expect(window.location.pathname).toBe("/");
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test.each([
  [400, "No pudimos procesar la solicitud"],
  [403, "No tienes acceso a esta sección"],
  [404, "No encontramos lo que buscas"],
  [409, "La información cambió"],
  [422, "Revisa la información ingresada"],
  [500, "Ocurrió un problema temporal"],
] as const)("presents the safe global state for API %i", async (status, text) => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER")), { status: 200 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(webResponse("SELLER").user), { status: 200 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ ...(status === 400 ? { code: "CORRELATION_ID_INVALID" } : {}), detail: "do not show", correlationId: "00000000-0000-4000-8000-000000000402" }), { status }),
    );
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "seller@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/seller/dashboard");
  render(<App />);

  await apiRequest("/protected-resource", { method: "GET" });

  await waitFor(() => expect(screen.getByText(text)).toBeTruthy());
  expect(screen.queryByText("do not show")).toBeNull();
  expect(canAccessPath("/seller/dashboard")).toBe(true);
  if (status === 409) {
    fireEvent.click(screen.getByRole("button", { name: "Recargar y revisar" }));
    expect(screen.queryByText("La información cambió")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }
  if (status === 500) {
    fireEvent.click(screen.getByRole("button", { name: "Volver al panel" }));
    expect(window.location.pathname).toBe("/seller/dashboard");
    expect(hasSession()).toBe(true);
  }
});

test("clears a pending API error when a different tenant replaces the session", async () => {
  const tenantA = {
    ...webResponse("SELLER"),
    user: { ...webResponse("SELLER").user, id: "seller-a", company: "tenant-a" },
  };
  const tenantB = {
    ...webResponse("COMPANY_ADMIN"),
    user: { ...webResponse("COMPANY_ADMIN").user, id: "admin-b", company: "tenant-b" },
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(tenantA), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tenantA.user), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tenantB), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tenantB.user), { status: 200 })),
  );
  await login({ identifier: "seller@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/seller/dashboard");
  render(<App />);
  await apiRequest("/protected-resource", { method: "GET" });
  await waitFor(() => expect(screen.getByText("La información cambió")).toBeTruthy());

  await login({ identifier: "admin@example.com", password: "correct-password" });

  await waitFor(() => expect(screen.queryByText("La información cambió")).toBeNull());
  expect(canAccessPath("/seller/dashboard")).toBe(false);
  expect(canAccessPath("/company/dashboard")).toBe(true);
});

test("discards a delayed 401 from tenant A after tenant B replaces its session", async () => {
  let resolveA: (response: Response) => void = () => undefined;
  const delayedA = new Promise<Response>((resolve) => {
    resolveA = resolve;
  });
  const tenantA = {
    ...webResponse("SELLER"),
    user: { ...webResponse("SELLER").user, id: "seller-a", company: "tenant-a" },
  };
  const tenantB = {
    ...webResponse("COMPANY_ADMIN"),
    user: { ...webResponse("COMPANY_ADMIN").user, id: "admin-b", company: "tenant-b" },
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(tenantA), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tenantA.user), { status: 200 }))
    .mockImplementationOnce(() => delayedA)
    .mockResolvedValueOnce(new Response(JSON.stringify(tenantB), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tenantB.user), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ correlationId: "00000000-0000-4000-8000-000000000403" }), { status: 401 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  await login({ identifier: "seller@example.com", password: "correct-password" });
  window.history.replaceState({}, "", "/seller/dashboard");
  render(<App />);

  const requestA = apiRequest("/protected-resource", { method: "GET" });
  await login({ identifier: "admin@example.com", password: "correct-password" });
  resolveA(new Response(JSON.stringify({ correlationId: "00000000-0000-4000-8000-000000000404" }), { status: 401 }));

  await expect(requestA).rejects.toBeInstanceOf(ApiRequestObsoleteError);
  expect(getSessionIdentity()).toMatchObject({ id: "admin-b", company: "tenant-b" });
  expect(canAccessPath("/company/dashboard")).toBe(true);
  expect(canAccessPath("/seller/dashboard")).toBe(false);
  expect(screen.queryByRole("dialog", { name: "Tu sesión terminó" })).toBeNull();
  expect(screen.queryByText("Correlation ID: 00000000-0000-4000-8000-000000000404")).toBeNull();

  await apiRequest("/protected-resource", { method: "GET" });

  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Tu sesión terminó" })).toBeTruthy(),
  );
  expect(screen.getByText("Correlation ID: 00000000-0000-4000-8000-000000000403")).toBeTruthy();
  expect(hasSession()).toBe(false);
});
