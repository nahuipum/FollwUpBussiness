import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }))

vi.mock('../features/auth/auth', () => ({
  login: loginMock,
  canAccessPath: vi.fn(),
  hasSession: vi.fn(),
  logout: vi.fn(),
  retryPendingLogout: vi.fn(),
}))

import { LoginScreen } from '../features/auth/components/LoginScreen'

afterEach(() => {
  vi.clearAllMocks()
  window.history.replaceState({}, '', '/')
})

test('submits valid credentials through the login client and processes its redirect', async () => {
  loginMock.mockResolvedValue({ ok: true, redirectTo: '/seller/dashboard' })
  render(<LoginScreen />)

  fireEvent.change(screen.getByLabelText('Correo o nombre de usuario'), { target: { value: ' seller@example.com ' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correct-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

  await waitFor(() => expect(loginMock).toHaveBeenCalledWith({ identifier: 'seller@example.com', password: 'correct-password' }))
  await waitFor(() => expect(window.location.pathname).toBe('/seller/dashboard'))
  expect(screen.getByLabelText('Contraseña')).toHaveProperty('value', '')
})
