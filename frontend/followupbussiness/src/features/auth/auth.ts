import { apiRequest, setApiSessionGeneration } from "../../lib/api";

export type UserRole =
  | "PLATFORM_SUPERADMIN"
  | "COMPANY_ADMIN"
  | "SUPERVISOR"
  | "SELLER";

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; retryAfterSeconds: number | null };

type LoginResponse = {
  channel: "WEB";
  credentials: { accessToken: string; tokenType: "Bearer"; expiresIn: 600 };
  csrfToken: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    status: "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED";
    roles: UserRole[];
    company: unknown;
  };
};

type Session = {
  accessToken: string;
  csrfToken: string;
  roles: UserRole[];
  user: LoginResponse["user"];
  expiresAt: number;
};

export type RefreshResult =
  | "refreshed"
  | "expired"
  | "unavailable"
  | "superseded";

let session: Session | null = null;
let fallbackClientInstanceId: string | null = null;
let logoutPendingInMemory = false;
let sessionGeneration = 0;
let refreshInFlight: {
  generation: number;
  promise: Promise<RefreshResult>;
} | null = null;
const sessionListeners = new Set<() => void>();

const genericError =
  "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.";
const logoutPendingKey = "followupbusiness.logout-pending";

function retryAfterSeconds(value: string | null): number | null {
  if (value === null) return null;
  const seconds = Number(value);
  if (Number.isInteger(seconds) && seconds > 0) return seconds;

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return null;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) || null;
}

export function getClientInstanceId(): string {
  const key = "followupbusiness.client-instance-id";
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return stored;
    const value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
    return value;
  } catch {
    fallbackClientInstanceId ??= crypto.randomUUID();
    return fallbackClientInstanceId;
  }
}

function setLogoutPending(value: boolean) {
  logoutPendingInMemory = value;
  try {
    if (value) window.localStorage.setItem(logoutPendingKey, "true");
    else window.localStorage.removeItem(logoutPendingKey);
  } catch {
    // The in-memory marker still prevents a refresh during this page lifetime.
  }
}

function notifySessionChange() {
  sessionListeners.forEach((listener) => listener());
}

function createSession(response: LoginResponse): Session {
  return {
    accessToken: response.credentials.accessToken,
    csrfToken: response.csrfToken,
    roles: response.user.roles,
    user: response.user,
    expiresAt: Date.now() + response.credentials.expiresIn * 1000,
  };
}

export function subscribeToSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function millisecondsUntilRefresh(): number | null {
  if (session === null) return null;
  return Math.max(0, session.expiresAt - Date.now() - 1000);
}

export function hasPendingLogout(): boolean {
  try {
    return (
      logoutPendingInMemory ||
      window.localStorage.getItem(logoutPendingKey) === "true"
    );
  } catch {
    return logoutPendingInMemory;
  }
}

function redirectFor(roles: UserRole[]): string | null {
  if (roles.includes("PLATFORM_SUPERADMIN")) return "/platform/companies";
  if (roles.includes("COMPANY_ADMIN")) return "/company/dashboard";
  if (roles.includes("SUPERVISOR")) return "/supervisor/dashboard";
  if (roles.includes("SELLER")) return "/seller/dashboard";
  return null;
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "PLATFORM_SUPERADMIN" ||
    value === "COMPANY_ADMIN" ||
    value === "SUPERVISOR" ||
    value === "SELLER"
  );
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Partial<LoginResponse>;
  return (
    response.channel === "WEB" &&
    typeof response.csrfToken === "string" &&
    response.csrfToken.length >= 43 &&
    response.csrfToken.length <= 128 &&
    typeof response.credentials?.accessToken === "string" &&
    response.credentials.accessToken.length > 0 &&
    response.credentials.accessToken.length <= 4096 &&
    response.credentials.tokenType === "Bearer" &&
    response.credentials.expiresIn === 600 &&
    typeof response.user?.id === "string" &&
    typeof response.user.displayName === "string" &&
    typeof response.user.email === "string" &&
    (response.user.status === "INVITED" ||
      response.user.status === "ACTIVE" ||
      response.user.status === "INACTIVE" ||
      response.user.status === "LOCKED") &&
    "company" in response.user &&
    Array.isArray(response.user?.roles) &&
    response.user.roles.length > 0 &&
    response.user.roles.every(isUserRole)
  );
}

async function rejectCookieBearingLogin(): Promise<LoginResult> {
  clearSession();
  setLogoutPending(true);
  await retryPendingLogout();
  return { ok: false, message: genericError, retryAfterSeconds: null };
}

export async function login(credentials: {
  identifier: string;
  password: string;
}): Promise<LoginResult> {
  if (hasPendingLogout() && !(await retryPendingLogout())) {
    return { ok: false, message: genericError, retryAfterSeconds: null };
  }
  clearSession();
  const loginGeneration = sessionGeneration;
  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Client": "WEB",
        "X-Client-Instance-Id": getClientInstanceId(),
      },
      body: JSON.stringify(credentials),
    });
    if (response.status !== 200) {
      return {
        ok: false,
        message: genericError,
        retryAfterSeconds:
          response.status === 429
            ? retryAfterSeconds(response.headers.get("Retry-After"))
            : null,
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return await rejectCookieBearingLogin();
    }
    if (!isLoginResponse(body)) return await rejectCookieBearingLogin();
    const redirectTo = redirectFor(body.user.roles);
    if (redirectTo === null) return await rejectCookieBearingLogin();

    session = createSession(body);
    notifySessionChange();
    return { ok: true, redirectTo };
  } catch {
    if (sessionGeneration === loginGeneration) clearSession();
    return { ok: false, message: genericError, retryAfterSeconds: null };
  }
}

export function clearSession() {
  sessionGeneration += 1;
  setApiSessionGeneration(sessionGeneration);
  session = null;
  refreshInFlight = null;
  setLogoutPending(false);
  notifySessionChange();
}

export function getSessionGeneration(): number {
  return sessionGeneration;
}

export function hasSession(): boolean {
  return session !== null;
}

export function getSessionIdentity(): Readonly<LoginResponse["user"]> | null {
  return session?.user ?? null;
}

export function canAccessPath(path: string): boolean {
  const requiredRole: Record<string, UserRole> = {
    "/platform/companies": "PLATFORM_SUPERADMIN",
    "/company/dashboard": "COMPANY_ADMIN",
    "/supervisor/dashboard": "SUPERVISOR",
    "/seller/dashboard": "SELLER",
  };
  const role = requiredRole[path];
  return session !== null && role !== undefined && session.roles.includes(role);
}

export function refreshSession(): Promise<RefreshResult> {
  if (
    refreshInFlight !== null &&
    refreshInFlight.generation === sessionGeneration
  )
    return refreshInFlight.promise;
  if (session === null || hasPendingLogout()) return Promise.resolve("expired");

  const currentSession = session;
  const generation = sessionGeneration;
  const isCurrentSession = () =>
    generation === sessionGeneration && session === currentSession;
  const promise = (async () => {
    try {
      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Auth-Client": "WEB",
          "X-Client-Instance-Id": getClientInstanceId(),
          "X-CSRF-Token": currentSession.csrfToken,
        },
      });
      if (!isCurrentSession()) return "superseded";
      if (response.status === 401 || response.status === 403 || response.status === 409) {
        clearSession();
        return "expired";
      }
      if (response.status !== 200) {
        clearSession();
        return "unavailable";
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        if (!isCurrentSession()) return "superseded";
        clearSession();
        return "expired";
      }
      if (!isCurrentSession()) return "superseded";
      if (!isLoginResponse(body)) {
        clearSession();
        return "expired";
      }

      session = createSession(body);
      notifySessionChange();
      return "refreshed";
    } catch {
      if (!isCurrentSession()) return "superseded";
      clearSession();
      return "unavailable";
    } finally {
      if (refreshInFlight?.generation === generation) refreshInFlight = null;
    }
  })();
  refreshInFlight = { generation, promise };
  return promise;
}

export async function logout(): Promise<void> {
  const currentSession = session;
  clearSession();
  setLogoutPending(true);
  if (currentSession === null) return;

  try {
    const response = await apiRequest("/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${currentSession.accessToken}`,
        "X-Auth-Client": "WEB",
        "X-Client-Instance-Id": getClientInstanceId(),
        "X-CSRF-Token": currentSession.csrfToken,
      },
    });
    if (response.status === 204) setLogoutPending(false);
  } catch {
    // The non-secret pending marker is retried only as a logout operation.
  }
}

export async function retryPendingLogout(): Promise<boolean> {
  if (!hasPendingLogout()) return true;
  try {
    const response = await apiRequest("/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Auth-Client": "WEB",
        "X-Client-Instance-Id": getClientInstanceId(),
        "X-Logout-Intent": "PENDING",
      },
    });
    if (response.status !== 204) return false;
    setLogoutPending(false);
    return true;
  } catch {
    return false;
  }
}
