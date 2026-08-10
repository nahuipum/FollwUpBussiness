import { apiRequest } from "../../lib/api";
import { getClientInstanceId } from "./auth";

export type PasswordRecoveryRequestResult =
  | { ok: true }
  | {
      ok: false;
      reason: "rate-limited" | "unavailable" | "temporary-error";
      retryAfterSeconds: number | null;
    };

export type PasswordResetResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "policy" | "temporary-error" };

function retryAfterSeconds(value: string | null): number | null {
  if (value === null) return null;
  const seconds = Number(value);
  if (Number.isInteger(seconds) && seconds > 0) return seconds;

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return null;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) || null;
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Auth-Client": "WEB",
    "X-Client-Instance-Id": getClientInstanceId(),
  };
}

export async function requestPasswordRecovery(
  email: string,
): Promise<PasswordRecoveryRequestResult> {
  try {
    const response = await apiRequest("/auth/password-recovery-requests", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    if (response.status === 202) {
      try {
        const body: unknown = await response.json();
        if (
          typeof body === "object" &&
          body !== null &&
          (body as { accepted?: unknown }).accepted === true
        )
          return { ok: true };
      } catch {
        // A malformed acceptance body must not produce a confirmation state.
      }
      return { ok: false, reason: "temporary-error", retryAfterSeconds: null };
    }
    if (response.status === 429)
      return {
        ok: false,
        reason: "rate-limited",
        retryAfterSeconds: retryAfterSeconds(
          response.headers.get("Retry-After"),
        ),
      };
    if (response.status === 503)
      return { ok: false, reason: "unavailable", retryAfterSeconds: null };
    return { ok: false, reason: "temporary-error", retryAfterSeconds: null };
  } catch {
    return { ok: false, reason: "temporary-error", retryAfterSeconds: null };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<PasswordResetResult> {
  try {
    const response = await apiRequest("/auth/password-resets", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({ token, newPassword }),
    });
    if (response.status === 204) return { ok: true };
    if (response.status === 410) return { ok: false, reason: "expired" };
    if (response.status === 400) return { ok: false, reason: "invalid" };
    if (response.status === 422) return { ok: false, reason: "policy" };
    return { ok: false, reason: "temporary-error" };
  } catch {
    return { ok: false, reason: "temporary-error" };
  }
}
