import { CloudAlert, FileSearch, House, RefreshCw, ShieldX } from "lucide-react";
import type { VisualAction } from "./InlineAlert";
import { CorrelationId } from "./CorrelationId";
import "../styles/error-ui.css";

export type ErrorStateVariant = "forbidden" | "not-found" | "temporary";

type ErrorStateProps = {
  variant: ErrorStateVariant;
  title: string;
  message: string;
  primaryAction: VisualAction;
  secondaryAction?: VisualAction;
  correlationId?: string;
  onCopyCorrelationId?: () => void;
};

const visuals = {
  forbidden: ShieldX,
  "not-found": FileSearch,
  temporary: CloudAlert,
} as const;

export function ErrorState({ variant, title, message, primaryAction, secondaryAction, correlationId, onCopyCorrelationId }: ErrorStateProps) {
  const Icon = visuals[variant];
  const PrimaryIcon = variant === "temporary" ? RefreshCw : House;

  return (
    <main className={`error-ui-state error-ui-state--${variant}`} aria-labelledby={`error-state-${variant}-title`}>
      <section className="error-ui-state__card">
        <span className="error-ui-state__illustration" aria-hidden="true"><Icon /></span>
        <h1 id={`error-state-${variant}-title`}>{title}</h1>
        <p>{message}</p>
        <div className="error-ui-state__actions">
          <button className="error-ui-button error-ui-button--primary" type="button" onClick={primaryAction.onClick}><PrimaryIcon aria-hidden="true" />{primaryAction.label}</button>
          {secondaryAction && <button className="error-ui-button error-ui-button--secondary" type="button" onClick={secondaryAction.onClick}><House aria-hidden="true" />{secondaryAction.label}</button>}
          {correlationId && <CorrelationId correlationId={correlationId} {...(onCopyCorrelationId ? { onCopy: onCopyCorrelationId } : {})} />}
        </div>
      </section>
    </main>
  );
}
