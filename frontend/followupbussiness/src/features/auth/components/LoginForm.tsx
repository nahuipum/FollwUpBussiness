import {
  Eye,
  EyeOff,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm";
import { AuthErrorDialog } from "./AuthErrorDialog";
import { AuthSecureFooter } from "./AuthSecureFooter";
import { navigate } from "../../../app/navigation";
import followUpLogo from "../assets/followup-logo.png";

export function LoginForm() {
  const form = useLoginForm();

  return (
    <section className="login-golden__main" aria-labelledby="login-title">
      <div className="login-golden__form">
        <img
          className="login-golden__mobile-logo"
          src={followUpLogo}
          alt="followUp Business"
        />
        <span className="login-golden__eyebrow">Acceso seguro</span>
        <h1 id="login-title">Inicia sesión</h1>
        <p className="login-golden__subtitle">
          Ingresa con las credenciales asignadas para acceder a tu panel.
        </p>
        <form
          noValidate
          onSubmit={form.handleSubmit}
          aria-busy={form.isSubmitting}
        >
          {form.retryAfterSeconds !== null && (
            <div className="login-golden__retry" role="status" aria-live="polite">
              <Clock3 aria-hidden="true" />
              <div>
                <strong>Espera antes de volver a intentarlo</strong>
                <p>
                  Por seguridad, espera {form.retryAfterSeconds} segundos antes
                  de volver a intentarlo.
                </p>
              </div>
            </div>
          )}
          <div className="login-golden__field">
            <label htmlFor="identifier">Correo o nombre de usuario</label>
            <div className={`login-golden__control${form.fieldErrors.identifier ? " login-golden__control--error" : ""}`}>
              <Mail className="login-golden__field-icon" aria-hidden="true" />
              <input
                id="identifier"
                autoComplete="username"
                disabled={form.isSubmitting}
                value={form.identifier}
                onChange={(event) => form.setIdentifier(event.target.value)}
                aria-describedby={
                  form.fieldErrors.identifier ? "identifier-error" : undefined
                }
                aria-invalid={Boolean(form.fieldErrors.identifier)}
                placeholder="nombre@empresa.com"
              />
            </div>
            {form.fieldErrors.identifier && (
              <p id="identifier-error" className="login-golden__field-error">
                {form.fieldErrors.identifier}
              </p>
            )}
          </div>
          <div className="login-golden__field">
            <label htmlFor="password">Contraseña</label>
            <div className={`login-golden__control login-golden__password-control${form.fieldErrors.password ? " login-golden__control--error" : ""}`}>
              <LockKeyhole className="login-golden__field-icon" aria-hidden="true" />
              <input
                id="password"
                type={form.showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={form.isSubmitting}
                value={form.password}
                onChange={(event) => form.setPassword(event.target.value)}
                aria-describedby={
                  form.fieldErrors.password ? "password-error" : undefined
                }
                aria-invalid={Boolean(form.fieldErrors.password)}
                placeholder="Ingresa tu contraseña"
              />
              <button
                className="login-golden__visibility"
                type="button"
                disabled={form.isSubmitting}
                aria-label={
                  form.showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                onClick={() => form.setShowPassword((current) => !current)}
              >
                {form.showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>
            </div>
            {form.fieldErrors.password && (
              <p id="password-error" className="login-golden__field-error">
                {form.fieldErrors.password}
              </p>
            )}
          </div>
          <div className="login-golden__helper">
            <span className="login-golden__remember">
              <span aria-hidden="true" />
              Recordarme
            </span>
            <a
              href="/password-recovery"
              className="login-golden__link"
              onClick={(event) => {
                event.preventDefault();
                navigate("/password-recovery");
              }}
            >
              ¿Necesitas ayuda?
            </a>
          </div>
          <button
            className="login-golden__submit"
            type="submit"
            disabled={form.isSubmitting || form.retryAfterSeconds !== null}
          >
            {form.isSubmitting && (
              <LoaderCircle className="login-golden__spinner" aria-hidden="true" />
            )}
            {form.isSubmitting
              ? "Iniciando sesión…"
              : "Iniciar sesión"}
          </button>
          {form.isSubmitting && (
            <p className="login-golden__loading-status" role="status">
              Validando credenciales y cargando tu panel
            </p>
          )}
        </form>
        <AuthSecureFooter />
      </div>
      {form.error !== null && (
        <AuthErrorDialog message={form.error} onClose={form.closeError} />
      )}
    </section>
  );
}
