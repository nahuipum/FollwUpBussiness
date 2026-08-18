import { apiRequest, setApiSessionGeneration } from "../../lib/api";

export type UserRole =
  | "PLATFORM_SUPERADMIN"
  | "COMPANY_ADMIN"
  | "SUPERVISOR"
  | "SELLER";

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; retryAfterSeconds: number | null };

type CurrentUser = {
  id: string;
  displayName: string;
  email: string;
  status: "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED";
  roles: UserRole[];
  company: unknown;
};

type LoginResponse = {
  channel: "WEB";
  credentials: { accessToken: string; tokenType: "Bearer"; expiresIn: 600 };
  csrfToken: string;
  user: CurrentUser;
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
let restoreInFlight: {
  generation: number;
  promise: Promise<RefreshResult>;
} | null = null;
const sessionListeners = new Set<() => void>();

const genericError =
  "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.";
const logoutPendingKey = "followupbusiness.logout-pending";
const csrfStorageKey = "followupbusiness.csrf-token";

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

function createSession(response: LoginResponse, user: CurrentUser): Session {
  persistCsrfToken(response.csrfToken);
  return {
    accessToken: response.credentials.accessToken,
    csrfToken: response.csrfToken,
    roles: user.roles,
    user,
    expiresAt: Date.now() + response.credentials.expiresIn * 1000,
  };
}

/**
 * The CSRF value is not a credential: it only proves that a same-origin page
 * intentionally uses the HttpOnly refresh cookie. Keeping it per tab lets a
 * hard reload restore the in-memory access session without persisting either
 * access or refresh tokens.
 */
function persistCsrfToken(csrfToken: string): void {
  try {
    window.sessionStorage.setItem(csrfStorageKey, csrfToken);
  } catch {
    // A reload will require login when session storage is unavailable.
  }
}

function storedCsrfToken(): string | null {
  try {
    const value = window.sessionStorage.getItem(csrfStorageKey);
    return value !== null && value.length >= 43 && value.length <= 128
      ? value
      : null;
  } catch {
    return null;
  }
}

function clearStoredCsrfToken(): void {
  try {
    window.sessionStorage.removeItem(csrfStorageKey);
  } catch {
    // There is no local credential to clean up.
  }
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

/** Default panel for the active in-memory session. */
export function getSessionHomePath(): string | null {
  return session === null ? null : redirectFor(session.roles);
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
    isCurrentUser(response.user)
  );
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (typeof value !== "object" || value === null) return false;
  const user = value as Partial<CurrentUser>;
  return (
    typeof user.id === "string" &&
    typeof user.displayName === "string" &&
    typeof user.email === "string" &&
    (user.status === "INVITED" ||
      user.status === "ACTIVE" ||
      user.status === "INACTIVE" ||
      user.status === "LOCKED") &&
    "company" in user &&
    Array.isArray(user.roles) &&
    user.roles.length > 0 &&
    user.roles.every(isUserRole)
  );
}

async function currentUser(accessToken: string): Promise<CurrentUser | null> {
  try {
    const response = await apiRequest("/me", {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    }, { publishErrors: false });
    if (response.status !== 200) return null;
    const body: unknown = await response.json().catch(() => null);
    return isCurrentUser(body) ? body : null;
  } catch {
    return null;
  }
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
    const user = await currentUser(body.credentials.accessToken);
    if (user === null) return await rejectCookieBearingLogin();
    const redirectTo = redirectFor(user.roles);
    if (redirectTo === null) return await rejectCookieBearingLogin();

    session = createSession(body, user);
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
  restoreInFlight = null;
  clearStoredCsrfToken();
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

/** Contract `CurrentUser.company` embeds the tenant company for WEB sessions. */
export function getSessionCompanyName(): string | null {
  const company = session?.user.company;
  if (typeof company !== "object" || company === null) return null;
  const legalName = (company as Record<string, unknown>).legalName;
  return typeof legalName === "string" && legalName.trim().length > 0
    ? legalName
    : null;
}

export function getSessionCompanyLabel(): string | null {
  const legalName = getSessionCompanyName();
  if (legalName === null || legalName.length <= 28) return legalName;
  return legalName.split(/\s+/)[0] ?? legalName;
}

/** Provides the current in-memory bearer value only to authenticated feature transport. */
export function getSessionAuthorization(): HeadersInit {
  return session === null ? {} : { Authorization: `Bearer ${session.accessToken}` };
}

/** Adds the per-session CSRF proof required by authenticated write operations. */
export function getSessionMutationAuthorization(): HeadersInit {
  return session === null
    ? {}
    : {
        Authorization: `Bearer ${session.accessToken}`,
        "X-CSRF-Token": session.csrfToken,
      };
}

export function canAccessPath(path: string): boolean {
  const requiredRole: Record<string, UserRole> = {
    "/platform/dashboard": "PLATFORM_SUPERADMIN",
    "/platform/companies": "PLATFORM_SUPERADMIN",
    "/company/dashboard": "COMPANY_ADMIN",
    "/company/clients": "COMPANY_ADMIN",
    "/company/sellers": "COMPANY_ADMIN",
    "/supervisor/dashboard": "SUPERVISOR",
    "/supervisor/sellers": "SUPERVISOR",
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
      }, { publishErrors: false });
      if (!isCurrentSession()) return "superseded";
      if (response.status === 401 || response.status === 403 || response.status === 409) {
        clearSession();
        return "expired";
      }
      if (response.status !== 200) {
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

      const user = await currentUser(body.credentials.accessToken);
      if (!isCurrentSession()) return "superseded";
      if (user === null) {
        clearSession();
        return "expired";
      }
      session = createSession(body, user);
      notifySessionChange();
      return "refreshed";
    } catch {
      if (!isCurrentSession()) return "superseded";
      return "unavailable";
    } finally {
      if (refreshInFlight?.generation === generation) refreshInFlight = null;
    }
  })();
  refreshInFlight = { generation, promise };
  return promise;
}

/** Restores an in-memory WEB session after a reload using the HttpOnly cookie. */
export function restoreSession(): Promise<RefreshResult> {
  if (session !== null) return Promise.resolve("refreshed");
  if (hasPendingLogout()) return Promise.resolve("expired");

  const csrfToken = storedCsrfToken();
  if (csrfToken === null) return Promise.resolve("expired");
  const generation = sessionGeneration;
  if (restoreInFlight?.generation === generation)
    return restoreInFlight.promise;

  const promise = (async (): Promise<RefreshResult> => {
    try {
      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Auth-Client": "WEB",
          "X-Client-Instance-Id": getClientInstanceId(),
          "X-CSRF-Token": csrfToken,
        },
      }, { publishErrors: false });
      if (generation !== sessionGeneration) return "superseded";
      if (response.status === 401 || response.status === 403 || response.status === 409) {
        clearSession();
        return "expired";
      }
      if (response.status !== 200) {
        clearSession();
        return "unavailable";
      }

      const body: unknown = await response.json().catch(() => null);
      if (generation !== sessionGeneration) return "superseded";
      if (!isLoginResponse(body)) {
        clearSession();
        return "expired";
      }

      const user = await currentUser(body.credentials.accessToken);
      if (generation !== sessionGeneration) return "superseded";
      if (user === null) {
        clearSession();
        return "expired";
      }
      session = createSession(body, user);
      notifySessionChange();
      return "refreshed";
    } catch {
      if (generation !== sessionGeneration) return "superseded";
      clearSession();
      return "unavailable";
    } finally {
      if (restoreInFlight?.generation === generation) restoreInFlight = null;
    }
  })();
  restoreInFlight = { generation, promise };
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
    }, { publishErrors: false });
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
    }, { publishErrors: false });
    if (response.status !== 204) return false;
    setLogoutPending(false);
    return true;
  } catch {
    return false;
  }
}
