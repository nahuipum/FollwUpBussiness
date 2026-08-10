import "./session-status-page.css";

type SessionStatusPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function SessionStatusPage({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: SessionStatusPageProps) {
  return (
    <main className="status-page" aria-labelledby="access-title">
      <section>
        <p className="status-eyebrow">{eyebrow}</p>
        <h1 id="access-title">{title}</h1>
        <p>{description}</p>
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </section>
    </main>
  );
}
