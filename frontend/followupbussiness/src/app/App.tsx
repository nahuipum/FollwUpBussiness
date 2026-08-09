import { LoginScreen } from '../features/auth/components/LoginScreen'
import { InvalidSessionDialog } from '../features/auth/components/InvalidSessionDialog'
import { SessionStatusPage } from './components/SessionStatusPage'
import { navigate } from './navigation'
import { useSessionRoute } from './hooks/useSessionRoute'
import { canAccessPath, hasSession, logout } from '../features/auth/auth'

export function App() {
  const { path, showInvalidSession, closeInvalidSession } = useSessionRoute()

  if (path === '/') return <LoginScreen />

  if (hasSession() && canAccessPath(path)) {
    return <SessionStatusPage
      eyebrow="Sesión iniciada"
      title="Redirigiendo a tu panel"
      description="La autorización para acceder a los recursos se comprobará en el servidor."
      actionLabel="Cerrar sesión"
      onAction={() => { void logout(); navigate('/') }}
    />
  }

  return <>
    {showInvalidSession && <InvalidSessionDialog onClose={closeInvalidSession} />}
    <SessionStatusPage
      eyebrow="Acceso no disponible"
      title="Inicia sesión para continuar"
      description="Tu sesión no está disponible o no tienes permiso para acceder a esta ruta."
      actionLabel="Ir al inicio de sesión"
      onAction={() => navigate('/')}
    />
  </>
}
