import { afterEach, expect, test, vi } from "vitest";
import { requestPasswordRecovery, resetPassword } from "./passwordRecovery";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test("sends a neutral recovery request with the required WEB headers", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );
  vi.stubGlobal("fetch", fetchMock);

  await expect(requestPasswordRecovery("person@example.com")).resolves.toEqual({
    ok: true,
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "https://backend.test/auth/password-recovery-requests",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({
        "X-Auth-Client": "WEB",
        "X-Client-Instance-Id": expect.any(String),
      }),
      body: JSON.stringify({ email: "person@example.com" }),
    }),
  );
});

test("maps cooldown and unavailable recovery responses without confirmation", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { "Retry-After": "30" } }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(requestPasswordRecovery("person@example.com")).resolves.toEqual({
    ok: false,
    reason: "rate-limited",
    retryAfterSeconds: 30,
  });
  await expect(requestPasswordRecovery("person@example.com")).resolves.toEqual({
    ok: false,
    reason: "unavailable",
    retryAfterSeconds: null,
  });
});

test("maps reset token and policy outcomes without retaining the token", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://backend.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 410 }))
    .mockResolvedValueOnce(new Response(null, { status: 400 }))
    .mockResolvedValueOnce(new Response(null, { status: 422 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    resetPassword("a".repeat(43), "correct-password"),
  ).resolves.toEqual({ ok: false, reason: "expired" });
  await expect(
    resetPassword("a".repeat(43), "correct-password"),
  ).resolves.toEqual({ ok: false, reason: "invalid" });
  await expect(
    resetPassword("a".repeat(43), "correct-password"),
  ).resolves.toEqual({ ok: false, reason: "policy" });
});
