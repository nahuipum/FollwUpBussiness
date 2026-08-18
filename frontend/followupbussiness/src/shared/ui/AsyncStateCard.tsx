import "./async-state-card.css";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "empty" | "error";
};

export function AsyncStateCard({ title, description, actionLabel, onAction, tone = "empty" }: Props) {
  return (
    <section className={`async-state-card async-state-card--${tone}`} {...(tone === "error" ? { role: "alert" } : {})}>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction && <button className="async-state-card__action" type="button" onClick={onAction}>{actionLabel}</button>}
    </section>
  );
}
