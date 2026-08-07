export type UserRole = 'PLATFORM_SUPERADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'SELLER'

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; retryAfterSeconds: number | null }

type LoginResponse = {
  channel: 'WEB'
  credentials: { accessToken: string; tokenType: 'Bearer'; expiresIn: 600 }
  csrfToken: string
  user: { id: string; displayName: string; email: string; status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LOCKED'; roles: UserRole[]; company: unknown }
}

type Session = { accessToken: string; csrfToken: string; roles: UserRole[] }

let session: Session | null = null
let fallbackClientInstanceId: string | null = null
let logoutPendingInMemory = false

const genericError = 'No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.'
const logoutPendingKey = 'followupbusiness.logout-pending'

function retryAfterSeconds(value: string | null): number | null {
  if (value === null) return null
  const seconds = Number(value)
  if (Number.isInteger(seconds) && seconds > 0) return seconds

  const retryAt = Date.parse(value)
  if (Number.isNaN(retryAt)) return null
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) || null
}

function getClientInstanceId(): string {
  const key = 'followupbusiness.client-instance-id'
  try {
    const stored = window.localStorage.getItem(key)
    if (stored !== null) return stored
    const value = crypto.randomUUID()
    window.localStorage.setItem(key, value)
    return value
  } catch {
    fallbackClientInstanceId ??= crypto.randomUUID()
    return fallbackClientInstanceId
  }
}

function setLogoutPending(value: boolean) {
  logoutPendingInMemory = value
  try {
    if (value) window.localStorage.setItem(logoutPendingKey, 'true')
    else window.localStorage.removeItem(logoutPendingKey)
  } catch {
    // The in-memory marker still prevents a refresh during this page lifetime.
  }
}

export function hasPendingLogout(): boolean {
  try {
    return logoutPendingInMemory || window.localStorage.getItem(logoutPendingKey) === 'true'
  } catch {
    return logoutPendingInMemory
  }
}

function redirectFor(roles: UserRole[]): string | null {
  if (roles.includes('PLATFORM_SUPERADMIN')) return '/platform/companies'
  if (roles.includes('COMPANY_ADMIN')) return '/company/dashboard'
  if (roles.includes('SUPERVISOR')) return '/supervisor/dashboard'
  if (roles.includes('SELLER')) return '/seller/dashboard'
  return null
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'PLATFORM_SUPERADMIN'
    || value === 'COMPANY_ADMIN'
    || value === 'SUPERVISOR'
    || value === 'SELLER'
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null) return false
  const response = value as Partial<LoginResponse>
  return response.channel === 'WEB'
    && typeof response.csrfToken === 'string' && response.csrfToken.length >= 43 && response.csrfToken.length <= 128
    && typeof response.credentials?.accessToken === 'string' && response.credentials.accessToken.length > 0 && response.credentials.accessToken.length <= 4096
    && response.credentials.tokenType === 'Bearer' && response.credentials.expiresIn === 600
    && typeof response.user?.id === 'string' && typeof response.user.displayName === 'string' && typeof response.user.email === 'string'
    && (response.user.status === 'INVITED' || response.user.status === 'ACTIVE' || response.user.status === 'INACTIVE' || response.user.status === 'LOCKED')
    && ('company' in response.user)
    && Array.isArray(response.user?.roles)
    && response.user.roles.length > 0
    && response.user.roles.every(isUserRole)
}

async function rejectCookieBearingLogin(): Promise<LoginResult> {
  clearSession()
  setLogoutPending(true)
  await retryPendingLogout()
  return { ok: false, message: genericError, retryAfterSeconds: null }
}

export async function login(credentials: { identifier: string; password: string }): Promise<LoginResult> {
  if (hasPendingLogout() && !await retryPendingLogout()) {
    return { ok: false, message: genericError, retryAfterSeconds: null }
  }
  clearSession()
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Client': 'WEB',
        'X-Client-Instance-Id': getClientInstanceId(),
      },
      body: JSON.stringify(credentials),
    })
    if (response.status !== 200) {
      return {
        ok: false,
        message: genericError,
        retryAfterSeconds: response.status === 429 ? retryAfterSeconds(response.headers.get('Retry-After')) : null,
      }
    }

    let body: unknown
    try {
      body = await response.json()
    } catch {
      return await rejectCookieBearingLogin()
    }
    if (!isLoginResponse(body)) return await rejectCookieBearingLogin()
    const redirectTo = redirectFor(body.user.roles)
    if (redirectTo === null) return await rejectCookieBearingLogin()

    session = { accessToken: body.credentials.accessToken, csrfToken: body.csrfToken, roles: body.user.roles }
    return { ok: true, redirectTo }
  } catch {
    clearSession()
    return { ok: false, message: genericError, retryAfterSeconds: null }
  }
}

export function clearSession() {
  session = null
  setLogoutPending(false)
}

export function hasSession(): boolean {
  return session !== null
}

export function canAccessPath(path: string): boolean {
  const requiredRole: Record<string, UserRole> = {
    '/platform/companies': 'PLATFORM_SUPERADMIN',
    '/company/dashboard': 'COMPANY_ADMIN',
    '/supervisor/dashboard': 'SUPERVISOR',
    '/seller/dashboard': 'SELLER',
  }
  const role = requiredRole[path]
  return session !== null && role !== undefined && session.roles.includes(role)
}

export async function logout(): Promise<void> {
  const currentSession = session
  clearSession()
  setLogoutPending(true)
  if (currentSession === null) return

  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${currentSession.accessToken}`,
        'X-Auth-Client': 'WEB',
        'X-Client-Instance-Id': getClientInstanceId(),
        'X-CSRF-Token': currentSession.csrfToken,
      },
    })
    if (response.status === 204) setLogoutPending(false)
  } catch {
    // The non-secret pending marker is retried only as a logout operation.
  }
}

export async function retryPendingLogout(): Promise<boolean> {
  if (!hasPendingLogout()) return true
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Auth-Client': 'WEB',
        'X-Client-Instance-Id': getClientInstanceId(),
        'X-Logout-Intent': 'PENDING',
      },
    })
    if (response.status !== 204) return false
    setLogoutPending(false)
    return true
  } catch {
    return false
  }
}
