import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  Check,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { navigate } from "../../../app/navigation";
import { usePasswordRecoveryForm } from "../hooks/usePasswordRecoveryForm";
import {
  isValidPasswordResetToken,
  usePasswordResetForm,
} from "../hooks/usePasswordResetForm";
import { PasswordRecoveryDialog } from "./PasswordRecoveryDialog";
import { PasswordRecoveryLayout } from "./PasswordRecoveryLayout";

type PasswordRecoveryRouteProps = {
  route: "request" | "confirmation" | "reset" | "success";
  token: string | null;
};
type TokenProblemReason = "expired" | "invalid" | "used";

function RouteHeading({ id, children }: { id: string; children: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <h1 id={id} ref={headingRef} tabIndex={-1}>
      {children}
    </h1>
  );
}

function TokenProblemDialog({ reason }: { reason: TokenProblemReason }) {
  void reason;
  return (
    <PasswordRecoveryDialog
      titleId="token-problem-title"
      title="Enlace vencido o no disponible"
      description="Este enlace ya expiró, fue reemplazado o no está disponible. Ponte en contacto con tu supervisor o administrador para que te reenvíe una nueva invitación."
      icon={<KeyRound />}
      primaryAction={{
        label: "Volver al inicio de sesión",
        onClick: () => navigate("/", { replace: true }),
      }}
      onDismiss={() => navigate("/", { replace: true })}
    />
  );
}

function TokenProblemFallback({ reason }: { reason: TokenProblemReason }) {
  return (
    <PasswordRecoveryLayout
      status
      hiddenFromAssistiveTechnology
      overlay={<TokenProblemDialog reason={reason} />}
    >
      <span className="recovery-golden__status-icon" aria-hidden="true">
        <KeyRound />
      </span>
      <RouteHeading id="token-fallback-title">Enlace no disponible</RouteHeading>
    </PasswordRecoveryLayout>
  );
}

type InlineAlertProps = {
  title: string;
  children: ReactNode;
  warning?: boolean;
};

function InlineAlert({ title, children, warning = false }: InlineAlertProps) {
  const Icon = warning ? Clock3 : CircleAlert;
  return (
    <div
      className={`recovery-golden__alert${warning ? " recovery-golden__alert--warning" : ""}`}
      role={warning ? "status" : "alert"}
      aria-live={warning ? "polite" : undefined}
    >
      <Icon aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </div>
  );
}

function RequestForm() {
  const form = usePasswordRecoveryForm(() =>
    navigate("/password-recovery/confirmation"),
  );
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form.fieldErrors.email) emailRef.current?.focus();
  }, [form.fieldErrors.email]);

  const unavailable = form.error?.includes("no está disponible") ?? false;

  return (
    <PasswordRecoveryLayout labelledBy="recovery-title">
      <span className="login-golden__eyebrow">Acceso seguro</span>
      <RouteHeading id="recovery-title">¿Olvidaste tu contraseña?</RouteHeading>
      <p className="login-golden__subtitle">
        Ingresa tu correo corporativo y te enviaremos instrucciones para
        restablecer el acceso.
      </p>
      <form
        className="recovery-golden__form"
        noValidate
        onSubmit={form.handleSubmit}
        aria-busy={form.isSubmitting}
      >
        {form.error && form.retryAfterSeconds === null && (
          <InlineAlert
            title={
              unavailable
                ? "Servicio no disponible"
                : "Ocurrió un problema temporal"
            }
          >
            {form.error}
          </InlineAlert>
        )}
        {form.retryAfterSeconds !== null && (
          <InlineAlert title="Espera antes de volver a intentarlo" warning>
            Ya estamos procesando una solicitud reciente. Por seguridad, espera{" "}
            {form.retryAfterSeconds} segundos antes de volver a intentarlo.
          </InlineAlert>
        )}
        <div className="login-golden__field">
          <label htmlFor="recovery-email">Correo electrónico</label>
          <div
            className={`login-golden__control${
              form.fieldErrors.email ? " login-golden__control--error" : ""
            }`}
          >
            <Mail className="login-golden__field-icon" aria-hidden="true" />
            <input
              ref={emailRef}
              id="recovery-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              disabled={
                form.isSubmitting || form.retryAfterSeconds !== null
              }
              value={form.email}
              onChange={(event) => form.setEmail(event.target.value)}
              aria-invalid={Boolean(form.fieldErrors.email)}
              aria-describedby={
                form.fieldErrors.email ? "recovery-email-error" : undefined
              }
              placeholder="nombre@empresa.com"
            />
          </div>
          {form.fieldErrors.email && (
            <p
              className="login-golden__field-error"
              id="recovery-email-error"
              role="alert"
            >
              {form.fieldErrors.email}
            </p>
          )}
        </div>
        <p className="recovery-golden__privacy">
          <Info aria-hidden="true" />
          <span>
            Por seguridad, el mensaje de confirmación no indicará si el correo
            está registrado.
          </span>
        </p>
        <div className="recovery-golden__actions">
          <button
            className="login-golden__submit"
            type="submit"
            disabled={
              form.isSubmitting || form.retryAfterSeconds !== null
            }
          >
            {form.isSubmitting && (
              <LoaderCircle
                className="login-golden__spinner"
                aria-hidden="true"
              />
            )}
            {form.isSubmitting
              ? "Enviando solicitud..."
              : form.retryAfterSeconds !== null
                ? `Espera ${form.retryAfterSeconds} s`
                : "Enviar enlace de recuperación"}
          </button>
          {form.isSubmitting && (
            <>
              <p className="login-golden__loading-status" role="status">
                Procesando tu solicitud
              </p>
              <div
                className="recovery-golden__loading-track"
                aria-hidden="true"
              >
                <span />
              </div>
            </>
          )}
          <button
            className="recovery-golden__link"
            type="button"
            onClick={() => navigate("/")}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </form>
    </PasswordRecoveryLayout>
  );
}

function Confirmation() {
  return (
    <PasswordRecoveryLayout labelledBy="recovery-confirmation-title" status>
      <span className="recovery-golden__status-icon" aria-hidden="true">
        <Mail />
      </span>
      <RouteHeading id="recovery-confirmation-title">
        Revisa tu correo
      </RouteHeading>
      <p className="recovery-golden__status-copy">
        Si existe una cuenta asociada al correo ingresado, recibirás
        instrucciones para restablecer tu contraseña.
      </p>
      <p className="recovery-golden__status-note">
        Revisa también tu carpeta de correo no deseado.
      </p>
      <div className="recovery-golden__actions">
        <button
          className="login-golden__submit"
          type="button"
          onClick={() => navigate("/")}
        >
          Volver al inicio de sesión
        </button>
        <button
          className="recovery-golden__link"
          type="button"
          onClick={() => navigate("/password-recovery")}
        >
          Usar otro correo
        </button>
      </div>
    </PasswordRecoveryLayout>
  );
}

function ResetForm({ token }: { token: string | null }) {
  const [tokenProblem, setTokenProblem] =
    useState<TokenProblemReason | null>(null);
  const form = usePasswordResetForm(
    token,
    () => navigate("/password-reset/success", { replace: true }),
    (reason) => setTokenProblem(reason === "expired" ? "expired" : "invalid"),
  );
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form.fieldErrors.newPassword) newPasswordRef.current?.focus();
    else if (form.fieldErrors.confirmation) confirmationRef.current?.focus();
  }, [form.fieldErrors.confirmation, form.fieldErrors.newPassword]);

  if (!isValidPasswordResetToken(token))
    return <TokenProblemFallback reason="invalid" />;

  const visualRules = [
    ["Mínimo 8 caracteres", form.newPassword.length >= 8],
    ["Una letra mayúscula", /[A-Z]/.test(form.newPassword)],
    ["Una letra minúscula", /[a-z]/.test(form.newPassword)],
    ["Un número", /\d/.test(form.newPassword)],
    ["Un carácter especial", /[^A-Za-z0-9]/.test(form.newPassword)],
  ] as const;
  const passwordsMatch =
    form.confirmation.length > 0 && form.newPassword === form.confirmation;

  return (
    <PasswordRecoveryLayout
      labelledBy="reset-title"
      overlay={
        tokenProblem ? <TokenProblemDialog reason={tokenProblem} /> : undefined
      }
    >
      <span className="login-golden__eyebrow">Acceso seguro</span>
      <RouteHeading id="reset-title">Crea una nueva contraseña</RouteHeading>
      <p className="login-golden__subtitle">
        Elige una contraseña segura para recuperar el acceso a tu cuenta.
      </p>
      <form
        className="recovery-golden__form recovery-golden__reset"
        noValidate
        onSubmit={form.handleSubmit}
        aria-busy={form.isSubmitting}
      >
        {form.error && (
          <InlineAlert title="No pudimos restablecer la contraseña">
            {form.error}
          </InlineAlert>
        )}
        <PasswordField
          id="new-password"
          label="Nueva contraseña"
          placeholder="Ingresa una nueva contraseña"
          value={form.newPassword}
          visible={form.showNewPassword}
          error={form.fieldErrors.newPassword}
          inputRef={newPasswordRef}
          disabled={form.isSubmitting}
          onChange={form.setNewPassword}
          onVisibleChange={form.setShowNewPassword}
        />
        <ul
          className="recovery-golden__rules"
          aria-label="Reglas de contraseña"
        >
          {visualRules.map(([rule, valid]) => (
            <li
              key={rule}
              className={`recovery-golden__rule${valid ? " is-valid" : ""}`}
            >
              <ShieldCheck aria-hidden="true" />
              {rule}
            </li>
          ))}
        </ul>
        <PasswordField
          id="confirm-password"
          label="Confirmar nueva contraseña"
          placeholder="Repite la nueva contraseña"
          value={form.confirmation}
          visible={form.showConfirmation}
          error={form.fieldErrors.confirmation}
          inputRef={confirmationRef}
          disabled={form.isSubmitting}
          onChange={form.setConfirmation}
          onVisibleChange={form.setShowConfirmation}
        />
        {form.confirmation && (
          <p
            className={`recovery-golden__match${passwordsMatch ? "" : " is-error"}`}
          >
            {passwordsMatch ? (
              <Check aria-hidden="true" />
            ) : (
              <CircleAlert aria-hidden="true" />
            )}
            {passwordsMatch
              ? "Las contraseñas coinciden."
              : "Las contraseñas no coinciden."}
          </p>
        )}
        <div className="recovery-golden__actions">
          <button
            className="login-golden__submit"
            type="submit"
            disabled={form.isSubmitting}
          >
            {form.isSubmitting && (
              <LoaderCircle
                className="login-golden__spinner"
                aria-hidden="true"
              />
            )}
            {form.isSubmitting ? "Restableciendo…" : "Restablecer contraseña"}
          </button>
          {form.isSubmitting && (
            <>
              <p className="login-golden__loading-status" role="status">
                Actualizando el acceso
              </p>
              <div
                className="recovery-golden__loading-track"
                aria-hidden="true"
              >
                <span />
              </div>
            </>
          )}
          <button
            className="recovery-golden__link"
            type="button"
            onClick={() => navigate("/", { replace: true })}
          >
            Cancelar y volver al inicio de sesión
          </button>
        </div>
      </form>
    </PasswordRecoveryLayout>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  error?: string | undefined;
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onChange: (value: string) => void;
  onVisibleChange: Dispatch<SetStateAction<boolean>>;
};

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  error,
  inputRef,
  disabled,
  onChange,
  onVisibleChange,
}: PasswordFieldProps) {
  return (
    <div className="login-golden__field">
      <label htmlFor={id}>{label}</label>
      <div
        className={`login-golden__control login-golden__password-control${
          error ? " login-golden__control--error" : ""
        }`}
      >
        <LockKeyhole
          className="login-golden__field-icon"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
        />
        <button
          className="login-golden__visibility"
          type="button"
          disabled={disabled}
          aria-label={
            visible
              ? `Ocultar ${label.toLowerCase()}`
              : `Mostrar ${label.toLowerCase()}`
          }
          onClick={() => onVisibleChange((shown) => !shown)}
        >
          {visible ? (
            <EyeOff aria-hidden="true" />
          ) : (
            <Eye aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p
          className="login-golden__field-error"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Success() {
  return (
    <PasswordRecoveryLayout labelledBy="reset-success-title" status>
      <span
        className="recovery-golden__status-icon recovery-golden__status-icon--success"
        aria-hidden="true"
      >
        <ShieldCheck />
      </span>
      <RouteHeading id="reset-success-title">
        Contraseña actualizada
      </RouteHeading>
      <p className="recovery-golden__status-copy">
        Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con
        tus nuevas credenciales.
      </p>
      <p className="recovery-golden__status-note">
        Por seguridad, el enlace utilizado dejó de estar disponible.
      </p>
      <div className="recovery-golden__actions">
        <button
          className="login-golden__submit"
          type="button"
          onClick={() => navigate("/")}
        >
          Ir al inicio de sesión
        </button>
      </div>
    </PasswordRecoveryLayout>
  );
}

export function PasswordRecoveryRoute({
  route,
  token,
}: PasswordRecoveryRouteProps) {
  if (route === "request") return <RequestForm />;
  if (route === "confirmation") return <Confirmation />;
  if (route === "success") return <Success />;
  return <ResetForm token={token} />;
}
