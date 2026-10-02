import { LogIn, ShieldAlert, X } from "lucide-react";
import { useRef } from "react";
import type { VisualAction } from "./InlineAlert";
import { CorrelationId } from "./CorrelationId";
import { ModalSurface } from "../../ModalSurface";
import "../styles/error-ui.css";

type SessionExpiredDialogProps = {
  title: string;
  message: string;
  primaryAction: VisualAction;
  secondaryAction?: VisualAction;
  dismissAction?: VisualAction;
  correlationId?: string;
};

export function SessionExpiredDialog({ title, message, primaryAction, secondaryAction, dismissAction, correlationId }: SessionExpiredDialogProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const dismiss = dismissAction?.onClick ?? primaryAction.onClick ?? (() => undefined);

  return (
    <ModalSurface
      titleId="session-expired-title"
      descriptionId="session-expired-message"
      onDismiss={dismiss}
      appearance="bottom-sheet"
      className="error-ui-dialog"
      initialFocusRef={primaryRef}
      dismissOnEscape={Boolean(dismissAction)}
      role="dialog"
    >
        {dismissAction && <button className="error-ui-dialog__dismiss" type="button" aria-label={dismissAction.label} onClick={dismissAction.onClick}><X aria-hidden="true" /></button>}
        <span className="error-ui-dialog__icon" aria-hidden="true"><ShieldAlert /></span>
        <h2 id="session-expired-title">{title}</h2>
        <p id="session-expired-message">{message}</p>
        <button ref={primaryRef} className="error-ui-button error-ui-button--primary" type="button" onClick={primaryAction.onClick}><LogIn aria-hidden="true" />{primaryAction.label}</button>
        {secondaryAction && <button className="error-ui-button error-ui-button--text" type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
        {correlationId && <CorrelationId correlationId={correlationId} />}
    </ModalSurface>
  );
}
