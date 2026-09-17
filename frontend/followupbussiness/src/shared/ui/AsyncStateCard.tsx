import "./async-state-card.css";
import type { ReactNode } from "react";
import { CorrelationId } from "./error-ui/components/CorrelationId";

type Props = {
  title: string;
  description: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  tone?: "empty" | "error";
  variant?: "default" | "golden";
  icon?: ReactNode;
  actionIcon?: ReactNode;
  correlationId?: string | null;
  headingLevel?: 1 | 2;
};

export function AsyncStateCard({ title, description, actionLabel, onAction, tone = "empty", variant = "default", icon, actionIcon, correlationId, headingLevel = 2 }: Props) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={`async-state-card async-state-card--${tone} async-state-card--${variant}`} {...(tone === "error" ? { role: "alert" } : {})}>
      {icon && <span className="async-state-card__icon" aria-hidden="true">{icon}</span>}<Heading>{title}</Heading>
      <p>{description}</p>
      {correlationId && <CorrelationId correlationId={correlationId} />}
      {actionLabel && onAction && <button className="async-state-card__action" type="button" onClick={onAction}>{actionIcon}{actionLabel}</button>}
    </section>
  );
}
