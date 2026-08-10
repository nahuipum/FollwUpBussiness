import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm";
import { AuthErrorDialog } from "./AuthErrorDialog";
import { AuthSecureFooter } from "./AuthSecureFooter";
import { PasswordRecoveryBrandMark } from "./BrandPanel";
import { navigate } from "../../../app/navigation";

export function LoginForm() {
  const form = useLoginForm();

  return (
    <section className="form-panel" aria-labelledby="login-title">
      <div className="form-wrap">
        <p className="mobile-brand">
          <PasswordRecoveryBrandMark />
          FollowUpBusiness
        </p>
        <p className="mobile-eyebrow">
          <ShieldCheck aria-hidden="true" />
          Acceso seguro
        </p>
        <h1 id="login-title">Inicia sesión</h1>
        <p className="subtitle">
          Ingresa con las credenciales asignadas para acceder a tu panel.
        </p>
        <form
          noValidate
          onSubmit={form.handleSubmit}
          aria-busy={form.isSubmitting}
        >
          {form.retryAfterSeconds !== null && (
            <p className="retry-notice" role="status" aria-live="polite">
              Por seguridad, espera {form.retryAfterSeconds} segundos antes de
              volver a intentarlo.
            </p>
          )}
          <div className="field">
            <label htmlFor="identifier">Correo o nombre de usuario</label>
            <div className="input-wrap">
              <Mail className="field-icon" aria-hidden="true" />
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
              <p id="identifier-error" className="field-error">
                {form.fieldErrors.identifier}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrap password-wrap">
              <LockKeyhole className="field-icon" aria-hidden="true" />
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
                className="visibility-button"
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
              <p id="password-error" className="field-error">
                {form.fieldErrors.password}
              </p>
            )}
          </div>
          <div className="helper-row">
            <span className="remember">
              <span aria-hidden="true" />
              Recordarme
            </span>
            <a
              href="/password-recovery"
              className="support"
              onClick={(event) => {
                event.preventDefault();
                navigate("/password-recovery");
              }}
            >
              ¿Necesitas ayuda?
            </a>
          </div>
          <button
            className="submit-button"
            type="submit"
            disabled={form.isSubmitting || form.retryAfterSeconds !== null}
          >
            {form.isSubmitting && (
              <LoaderCircle className="spinner" aria-hidden="true" />
            )}
            {form.isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
          {form.isSubmitting && (
            <p className="loading-status" role="status">
              Validando credenciales y cargando tu panel
            </p>
          )}
          {form.isSubmitting && (
            <div className="loading-progress" aria-hidden="true">
              <div>
                <span />
              </div>
            </div>
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
