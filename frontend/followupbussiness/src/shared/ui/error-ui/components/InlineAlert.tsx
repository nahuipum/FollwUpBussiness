import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { CorrelationId } from "./CorrelationId";
import "../styles/error-ui.css";

export type InlineAlertVariant = "warning" | "error";

export type VisualAction = {
  label: string;
  onClick?: () => void;
};

type InlineAlertProps = {
  variant: InlineAlertVariant;
  title?: string;
  message: ReactNode;
  action?: VisualAction;
  correlationId?: string;
  className?: string;
};

export function InlineAlert({ variant, title, message, action, correlationId, className }: InlineAlertProps) {
  const Icon = variant === "warning" ? CircleAlert : Info;

  return (
    <section className={`error-ui-inline-alert error-ui-inline-alert--${variant}${className ? ` ${className}` : ""}`} role="alert">
      <span className="error-ui-inline-alert__icon" aria-hidden="true"><Icon /></span>
      <div className="error-ui-inline-alert__content">
        {title && <h2>{title}</h2>}
        <p>{message}</p>
        {correlationId && <CorrelationId correlationId={correlationId} />}
      </div>
      {action && <button className="error-ui-inline-alert__action" type="button" onClick={action.onClick}>{action.label}</button>}
    </section>
  );
}
