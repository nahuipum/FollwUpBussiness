import { useEffect, useState, type FormEvent } from 'react'
import { ChartNoAxesCombined, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { canAccessPath, hasSession, login, logout, retryPendingLogout, type LoginResult } from '../features/auth/auth'

type FieldErrors = {
  identifier?: string
  password?: string
}

function validate(identifier: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  if (identifier.trim().length < 3 || identifier.trim().length > 254) {
    errors.identifier = 'Ingresa un correo electrónico o usuario válido.'
  }
  if (password.length < 8 || password.length > 200) {
    errors.password = 'La contraseña debe tener entre 8 y 200 caracteres.'
  }

  return errors
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
}

function LoginScreen() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (retryAfterSeconds === null) return
    const timer = window.setTimeout(() => {
      setRetryAfterSeconds((seconds) => seconds === null || seconds <= 1 ? null : seconds - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [retryAfterSeconds])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(identifier, password)
    setFieldErrors(errors)
    setError(null)
    if (Object.keys(errors).length > 0 || retryAfterSeconds !== null) return

    setIsSubmitting(true)
    const result: LoginResult = await login({ identifier: identifier.trim(), password })
    setPassword('')
    setIsSubmitting(false)

    if (result.ok) {
      navigate(result.redirectTo)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    setError(result.message)
    setRetryAfterSeconds(result.retryAfterSeconds)
  }

  return (
    <main className="login-panel">
      <section className="brand-panel" aria-label="FollowUpBusiness">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><ChartNoAxesCombined /></span>FollowUpBusiness</div>
        <div className="hero">
          <p className="eyebrow">Gestión comercial en campo</p>
          <h1>Tu operación, organizada desde el primer contacto.</h1>
          <p>Accede al panel para gestionar clientes, seguimiento y rutas de trabajo desde un solo lugar.</p>
          <div className="route-preview" aria-hidden="true"><div className="route-top"><i /><i /><i /></div><div className="route-line" /><span /><span /><span /><div className="visit-card"><b>Próxima visita</b><i /><i /></div></div>
        </div>
        <p className="brand-foot">Plataforma de uso interno · Acceso protegido</p>
      </section>

      <section className="form-panel" aria-labelledby="login-title">
        <div className="form-wrap">
          <p className="mobile-brand"><span className="brand-mark" aria-hidden="true"><ChartNoAxesCombined /></span>FollowUpBusiness</p>
          <h1 id="login-title">Inicia sesión</h1>
          <p className="subtitle">Ingresa con las credenciales asignadas para acceder a tu panel.</p>
          <form noValidate onSubmit={handleSubmit}>
            {error !== null && <p className="form-error" role="alert">{error}</p>}
            {retryAfterSeconds !== null && <p className="retry-notice" role="status" aria-live="polite">Por seguridad, espera {retryAfterSeconds} segundos antes de volver a intentarlo.</p>}
            <div className="field">
              <label htmlFor="identifier">Correo electrónico</label>
              <div className="input-wrap">
                <Mail className="field-icon" aria-hidden="true" />
                <input id="identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined} aria-invalid={Boolean(fieldErrors.identifier)} placeholder="nombre@empresa.com" />
              </div>
              {fieldErrors.identifier && <p id="identifier-error" className="field-error">{fieldErrors.identifier}</p>}
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrap password-wrap">
                <LockKeyhole className="field-icon" aria-hidden="true" />
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} aria-invalid={Boolean(fieldErrors.password)} placeholder="Ingresa tu contraseña" />
                <button className="visibility-button" type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
              </div>
              {fieldErrors.password && <p id="password-error" className="field-error">{fieldErrors.password}</p>}
            </div>
            <div className="helper-row"><span className="remember"><span aria-hidden="true" />Recordarme</span><a href="#support" className="support">¿Necesitas ayuda?</a></div>
            <button className="submit-button" type="submit" disabled={isSubmitting || retryAfterSeconds !== null}>{isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
            <p className="secure-notice"><ShieldCheck aria-hidden="true" />Tus credenciales se procesan de forma segura.</p>
          </form>
          <p className="copyright">© 2026 FollowUpBusiness</p>
        </div>
      </section>
    </main>
  )
}

function ProtectedRoute() {
  return (
    <main className="status-page" aria-labelledby="access-title">
      <section>
        <p className="eyebrow">Sesión iniciada</p>
        <h1 id="access-title">Redirigiendo a tu panel</h1>
        <p>La autorización para acceder a los recursos se comprobará en el servidor.</p>
        <button type="button" onClick={() => { void logout(); navigate('/'); window.dispatchEvent(new PopStateEvent('popstate')) }}>Cerrar sesión</button>
      </section>
    </main>
  )
}

function AccessDenied() {
  return (
    <main className="status-page" aria-labelledby="access-title">
      <section>
        <p className="eyebrow">Acceso no disponible</p>
        <h1 id="access-title">Inicia sesión para continuar</h1>
        <p>Tu sesión no está disponible o no tienes permiso para acceder a esta ruta.</p>
        <button type="button" onClick={() => { navigate('/'); window.dispatchEvent(new PopStateEvent('popstate')) }}>Ir al inicio de sesión</button>
      </section>
    </main>
  )
}

export function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname)
    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [])

  useEffect(() => {
    void retryPendingLogout()
    const retryOnReconnect = () => { void retryPendingLogout() }
    window.addEventListener('online', retryOnReconnect)
    return () => window.removeEventListener('online', retryOnReconnect)
  }, [])

  if (path === '/') return <LoginScreen />
  return hasSession() && canAccessPath(path) ? <ProtectedRoute /> : <AccessDenied />
}
