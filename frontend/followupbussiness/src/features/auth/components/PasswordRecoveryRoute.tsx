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
    headingRef.current?.focus();
  }, []);
  return <h1 id={id} ref={headingRef} tabIndex={-1}>{children}</h1>;
}

function TokenProblemDialog({ reason }: { reason: TokenProblemReason }) {
  const expired = reason === "expired";
  return <PasswordRecoveryDialog titleId="token-problem-title" title={expired ? "Enlace vencido o no válido" : reason === "used" ? "Enlace ya utilizado" : "Enlace no válido"} description={expired ? "Por seguridad, el enlace de restablecimiento ya no está disponible. Solicita uno nuevo para continuar." : "No pudimos validar este enlace de restablecimiento. Solicita uno nuevo para continuar de forma segura."} icon={<KeyRound />} primaryAction={{ label: "Solicitar nuevo enlace", onClick: () => navigate("/password-recovery", { replace: true }) }} secondaryAction={{ label: "Volver al inicio de sesión", onClick: () => navigate("/", { replace: true }) }} onDismiss={() => navigate("/password-recovery", { replace: true })} />;
}

function TokenProblemFallback({ reason }: { reason: TokenProblemReason }) {
  return <PasswordRecoveryLayout status hiddenFromAssistiveTechnology overlay={<TokenProblemDialog reason={reason} />}><KeyRound className="recovery-status-icon" aria-hidden="true" /><RouteHeading id="token-fallback-title">{reason === "expired" ? "Enlace vencido" : "Enlace no válido"}</RouteHeading></PasswordRecoveryLayout>;
}

function InlineAlert({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <p className={`recovery-alert inline-alert is-visible${warning ? " warning" : ""}`} role={warning ? "status" : "alert"}><CircleAlert aria-hidden="true" />{children}</p>;
}

function RequestForm() {
  const form = usePasswordRecoveryForm(() => navigate("/password-recovery/confirmation"));
  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (form.fieldErrors.email) emailRef.current?.focus(); }, [form.fieldErrors.email]);
  return <PasswordRecoveryLayout labelledBy="recovery-title"><RouteHeading id="recovery-title">¿Olvidaste tu contraseña?</RouteHeading><p className="subtitle">Ingresa tu correo corporativo y te enviaremos instrucciones para restablecer el acceso.</p><form noValidate onSubmit={form.handleSubmit} aria-busy={form.isSubmitting}>{form.error && <InlineAlert>{form.error}</InlineAlert>}{form.retryAfterSeconds !== null && <InlineAlert warning>Por seguridad, espera {form.retryAfterSeconds} segundos antes de volver a intentarlo.</InlineAlert>}<div className={`field${form.fieldErrors.email ? " has-error" : ""}`}><label htmlFor="recovery-email">Correo electrónico</label><div className="input-wrap"><Mail className="field-icon" aria-hidden="true" /><input ref={emailRef} id="recovery-email" type="email" autoComplete="email" maxLength={254} disabled={form.isSubmitting || form.retryAfterSeconds !== null} value={form.email} onChange={(event) => form.setEmail(event.target.value)} aria-invalid={Boolean(form.fieldErrors.email)} aria-describedby={form.fieldErrors.email ? "recovery-email-error" : undefined} placeholder="nombre@empresa.com" /></div>{form.fieldErrors.email && <p className="field-error" id="recovery-email-error" role="alert">{form.fieldErrors.email}</p>}</div><p className="privacy-note"><Info aria-hidden="true" />Por seguridad, el mensaje de confirmación no indicará si el correo está registrado.</p><button className="submit-button primary-button" type="submit" disabled={form.isSubmitting || form.retryAfterSeconds !== null}>{form.isSubmitting && <LoaderCircle className="spinner" aria-hidden="true" />}{form.isSubmitting ? "Enviando solicitud..." : "Enviar enlace de recuperación"}</button>{form.isSubmitting && <><p className="loading-status" role="status">Procesando tu solicitud</p><div className="loading-progress progress is-visible" aria-hidden="true"><span /></div></>}<button className="recovery-link text-link" type="button" onClick={() => navigate("/")}>Volver al inicio de sesión</button></form></PasswordRecoveryLayout>;
}

function Confirmation() {
  return <PasswordRecoveryLayout labelledBy="recovery-confirmation-title" status><Mail aria-hidden="true" className="recovery-status-icon status-icon" /><RouteHeading id="recovery-confirmation-title">Revisa tu correo</RouteHeading><p className="subtitle status-copy">Si existe una cuenta asociada al correo ingresado, recibirás instrucciones para restablecer tu contraseña.</p><p className="status-note">Revisa también tu carpeta de correo no deseado.</p><button className="submit-button primary-button" type="button" onClick={() => navigate("/")}>Volver al inicio de sesión</button><button className="recovery-link text-link" type="button" onClick={() => navigate("/password-recovery")}>Usar otro correo</button></PasswordRecoveryLayout>;
}

function ResetForm({ token }: { token: string | null }) {
  const [tokenProblem, setTokenProblem] = useState<TokenProblemReason | null>(null);
  const form = usePasswordResetForm(token, () => navigate("/password-reset/success", { replace: true }), (reason) => setTokenProblem(reason === "expired" ? "expired" : "invalid"));
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (form.fieldErrors.newPassword) newPasswordRef.current?.focus(); else if (form.fieldErrors.confirmation) confirmationRef.current?.focus(); }, [form.fieldErrors.confirmation, form.fieldErrors.newPassword]);
  if (!isValidPasswordResetToken(token)) return <TokenProblemFallback reason="invalid" />;
  const isReady = form.newPassword.length >= 8 && form.confirmation.length > 0 && form.newPassword === form.confirmation;
  const visualRules = ["Mínimo 8 caracteres", "Una letra mayúscula", "Una letra minúscula", "Un número", "Un carácter especial"];
  return <PasswordRecoveryLayout labelledBy="reset-title" overlay={tokenProblem ? <TokenProblemDialog reason={tokenProblem} /> : undefined}><RouteHeading id="reset-title">Crea una nueva contraseña</RouteHeading><p className="subtitle">Elige una contraseña segura para recuperar el acceso a tu cuenta.</p><form className="reset-view" noValidate onSubmit={form.handleSubmit} aria-busy={form.isSubmitting}>{form.error && <InlineAlert>{form.error}</InlineAlert>}<PasswordField id="new-password" label="Nueva contraseña" value={form.newPassword} visible={form.showNewPassword} error={form.fieldErrors.newPassword} inputRef={newPasswordRef} disabled={form.isSubmitting} onChange={form.setNewPassword} onVisibleChange={form.setShowNewPassword} /><ul className="password-rules" aria-label="Reglas de contraseña">{visualRules.map((rule, index) => <li key={rule} className={`password-rule${index === 0 && form.newPassword.length >= 8 ? " is-valid" : ""}`}><span className="rule-dot"><Check aria-hidden="true" /></span>{rule}</li>)}</ul><PasswordField id="confirm-password" label="Confirmar nueva contraseña" value={form.confirmation} visible={form.showConfirmation} error={form.fieldErrors.confirmation} inputRef={confirmationRef} disabled={form.isSubmitting} onChange={form.setConfirmation} onVisibleChange={form.setShowConfirmation} /><p className={`match-helper${form.confirmation ? " is-visible" : ""}${form.confirmation && !isReady ? " is-error" : ""}`}><Check aria-hidden="true" />{isReady ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}</p><button className="submit-button primary-button" type="submit" disabled={form.isSubmitting}>{form.isSubmitting && <LoaderCircle className="spinner" aria-hidden="true" />}{form.isSubmitting ? "Restableciendo…" : "Restablecer contraseña"}</button>{form.isSubmitting && <><p className="loading-status" role="status">Actualizando el acceso</p><div className="loading-progress progress is-visible" aria-hidden="true"><span /></div></>}<button className="recovery-link text-link" type="button" onClick={() => navigate("/", { replace: true })}>Cancelar y volver al inicio de sesión</button></form></PasswordRecoveryLayout>;
}

type PasswordFieldProps = { id: string; label: string; value: string; visible: boolean; error?: string | undefined; inputRef: RefObject<HTMLInputElement | null>; disabled: boolean; onChange: (value: string) => void; onVisibleChange: Dispatch<SetStateAction<boolean>> };
function PasswordField({ id, label, value, visible, error, inputRef, disabled, onChange, onVisibleChange }: PasswordFieldProps) {
  return <div className="field"><label htmlFor={id}>{label}</label><div className="input-wrap password-wrap"><LockKeyhole className="field-icon" aria-hidden="true" /><input ref={inputRef} id={id} type={visible ? "text" : "password"} autoComplete="new-password" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} /><button className="visibility-button" type="button" disabled={disabled} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} onClick={() => onVisibleChange((shown) => !shown)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>{error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}</div>;
}

function Success() {
  return <PasswordRecoveryLayout labelledBy="reset-success-title" status><ShieldCheck aria-hidden="true" className="recovery-status-icon status-icon" /><RouteHeading id="reset-success-title">Contraseña actualizada</RouteHeading><p className="subtitle status-copy">Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.</p><p className="status-note">Por seguridad, el enlace utilizado dejó de estar disponible.</p><button className="submit-button primary-button" type="button" onClick={() => navigate("/")}>Ir al inicio de sesión</button></PasswordRecoveryLayout>;
}

export function PasswordRecoveryRoute({ route, token }: PasswordRecoveryRouteProps) {
  if (route === "request") return <RequestForm />;
  if (route === "confirmation") return <Confirmation />;
  if (route === "success") return <Success />;
  return <ResetForm token={token} />;
}
