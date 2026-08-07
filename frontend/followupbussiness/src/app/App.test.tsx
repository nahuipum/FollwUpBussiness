import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { App } from './App'
import { canAccessPath, clearSession, hasPendingLogout, hasSession, login, logout, retryPendingLogout } from '../features/auth/auth'

const webResponse = (role: string) => ({
  channel: 'WEB',
  credentials: { accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 600 },
  csrfToken: 'c'.repeat(43),
  user: { id: '00000000-0000-4000-8000-000000000001', displayName: 'Usuario de prueba', email: 'user@example.com', status: 'ACTIVE', roles: [role], company: null },
})

afterEach(() => {
  cleanup()
  clearSession()
  vi.unstubAllGlobals()
  window.localStorage.removeItem('followupbusiness.logout-pending')
  window.history.replaceState({}, '', '/')
})

test('validates credentials before sending them', () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

  expect(screen.getByText('Ingresa un correo electrónico o usuario válido.')).toBeTruthy()
  expect(screen.getByText('La contraseña debe tener entre 8 y 200 caracteres.')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('keeps password hidden until explicitly requested', () => {
  render(<App />)
  const password = screen.getByLabelText('Contraseña')
  expect(password).toHaveProperty('type', 'password')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
  expect(password).toHaveProperty('type', 'text')
})

test('uses WEB headers and redirects each contractual role', async () => {
  const roles = [
    ['PLATFORM_SUPERADMIN', '/platform/companies'],
    ['COMPANY_ADMIN', '/company/dashboard'],
    ['SUPERVISOR', '/supervisor/dashboard'],
    ['SELLER', '/seller/dashboard'],
  ] as const

  for (const [role, expectedPath] of roles) {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(webResponse(role)), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const view = render(<App />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'seller@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => expect(window.location.pathname).toBe(expectedPath))
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include', headers: expect.objectContaining({ 'X-Auth-Client': 'WEB' }) })
    view.unmount()
    clearSession()
    window.history.replaceState({}, '', '/')
  }
})

test('shows the same generic error and clears the password after a failed login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'AUTHENTICATION_FAILED' }), { status: 401 })))
  render(<App />)
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'seller@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correct-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No fue posible iniciar sesión'))
  expect(screen.getByLabelText('Contraseña')).toHaveProperty('value', '')
})

test('honors Retry-After after a rate-limited response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { 'Retry-After': '60' } })))
  render(<App />)
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'seller@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correct-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('espera 60 segundos'))
  expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveProperty('disabled', true)
})

test('closes a cookie-bearing invalid 200 without navigating or retaining a local session', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(webResponse('UNTRUSTED_ROLE')), { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'seller@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correct-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.'))
  expect(window.location.pathname).toBe('/')
  expect(hasSession()).toBe(false)
  expect(canAccessPath('/seller/dashboard')).toBe(false)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock.mock.calls[1]).toEqual(['/auth/logout', expect.objectContaining({
    method: 'POST', credentials: 'include', headers: expect.objectContaining({
      'X-Auth-Client': 'WEB', 'X-Logout-Intent': 'PENDING',
    }),
  })])
  expect(hasPendingLogout()).toBe(false)
})

test('keeps local authentication closed when the pending cookie logout fails', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{malformed', { status: 200 }))
    .mockRejectedValueOnce(new Error('offline'))
  vi.stubGlobal('fetch', fetchMock)

  const result = await login({ identifier: 'seller@example.com', password: 'correct-password' })

  expect(result).toEqual({ ok: false, message: 'No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.', retryAfterSeconds: null })
  expect(hasSession()).toBe(false)
  expect(canAccessPath('/seller/dashboard')).toBe(false)
  expect(hasPendingLogout()).toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test('segregates routes and revokes the session on logout', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(webResponse('SELLER')), { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)

  await login({ identifier: 'seller@example.com', password: 'correct-password' })
  expect(canAccessPath('/seller/dashboard')).toBe(true)
  expect(canAccessPath('/platform/companies')).toBe(false)
  await logout()

  expect(canAccessPath('/seller/dashboard')).toBe(false)
  expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ credentials: 'include', headers: expect.objectContaining({ 'X-CSRF-Token': 'c'.repeat(43) }) })
  expect(hasPendingLogout()).toBe(false)
})

test('retries only a pending logout without keeping a renewable session', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(webResponse('SELLER')), { status: 200 }))
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)

  await login({ identifier: 'seller@example.com', password: 'correct-password' })
  await logout()
  expect(hasPendingLogout()).toBe(true)
  expect(canAccessPath('/seller/dashboard')).toBe(false)
  await expect(retryPendingLogout()).resolves.toBe(true)
  expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ headers: expect.objectContaining({ 'X-Logout-Intent': 'PENDING' }) })
  expect(hasPendingLogout()).toBe(false)
})
