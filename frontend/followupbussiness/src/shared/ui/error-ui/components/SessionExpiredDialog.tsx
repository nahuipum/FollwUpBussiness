import { LogIn, ShieldAlert, X } from "lucide-react";
import type { VisualAction } from "./InlineAlert";
import { CorrelationId } from "./CorrelationId";
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
  return (
    <div className="error-ui-dialog-backdrop">
      <section className="error-ui-dialog" role="dialog" aria-modal="true" aria-labelledby="session-expired-title" aria-describedby="session-expired-message">
        {dismissAction && <button className="error-ui-dialog__dismiss" type="button" aria-label={dismissAction.label} onClick={dismissAction.onClick}><X aria-hidden="true" /></button>}
        <span className="error-ui-dialog__icon" aria-hidden="true"><ShieldAlert /></span>
        <h2 id="session-expired-title">{title}</h2>
        <p id="session-expired-message">{message}</p>
        <button className="error-ui-button error-ui-button--primary" type="button" onClick={primaryAction.onClick}><LogIn aria-hidden="true" />{primaryAction.label}</button>
        {secondaryAction && <button className="error-ui-button error-ui-button--text" type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
        {correlationId && <CorrelationId correlationId={correlationId} />}
      </section>
    </div>
  );
}
