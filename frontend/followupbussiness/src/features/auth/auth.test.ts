import { afterEach, expect, test, vi } from "vitest";
import { clearSession, login } from "./auth";

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

afterEach(() => {
  clearSession();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test("sends the contractual WEB login request to the configured final URL", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://localhost:8080");
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(webResponse), { status: 200 }),
    );
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toEqual({ ok: true, redirectTo: "/seller/dashboard" });

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledWith(
    "https://localhost:8080/auth/login",
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

test("fails safely when API base URL is missing or the response is semantically invalid", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toMatchObject({ ok: false });
  expect(fetchMock).not.toHaveBeenCalled();

  vi.stubEnv("VITE_API_BASE_URL", "http://backend.test");
  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toMatchObject({ ok: false });
  expect(fetchMock).not.toHaveBeenCalled();

  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ channel: "WEB" }), { status: 200 }),
  );
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(
    login({ identifier: "seller@example.com", password: "correct-password" }),
  ).resolves.toMatchObject({ ok: false });
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
