export function CompanyUsersStateCard({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="company-users__state">
      <h2>{title}</h2>
      <p>{description}</p>
      <button
        className="company-users__secondary"
        type="button"
        onClick={onAction}
      >
        {action}
      </button>
    </section>
  );
}
