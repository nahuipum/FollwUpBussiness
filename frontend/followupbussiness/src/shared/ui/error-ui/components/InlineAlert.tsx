import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { CorrelationId } from "./CorrelationId";
import "../styles/error-ui.css";

export type InlineAlertVariant = "info" | "warning" | "error";

export type VisualAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type InlineAlertProps = {
  variant: InlineAlertVariant;
  title?: string;
  message: ReactNode;
  action?: VisualAction;
  correlationId?: string;
  className?: string;
  icon?: ReactNode;
};

export function InlineAlert({ variant, title, message, action, correlationId, className, icon }: InlineAlertProps) {
  const Icon = variant === "info" ? Info : TriangleAlert;

  return (
    <section className={`error-ui-inline-alert error-ui-inline-alert--${variant}${className ? ` ${className}` : ""}`} role={variant === "info" ? "status" : "alert"}>
      <span className="error-ui-inline-alert__icon" aria-hidden="true">{icon ?? <Icon />}</span>
      <div className="error-ui-inline-alert__content">
        {title && <h2>{title}</h2>}
        <p>{message}</p>
        {correlationId && <CorrelationId correlationId={correlationId} />}
      </div>
      {action && <button className="error-ui-inline-alert__action" type="button" onClick={action.onClick} disabled={action.disabled}>{action.label}</button>}
    </section>
  );
}
