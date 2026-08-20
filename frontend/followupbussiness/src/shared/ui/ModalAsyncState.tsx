import { CircleAlert, LoaderCircle } from "lucide-react";
import "./modal-async-state.css";

type Action = Readonly<{ label: string; onClick: () => void }>;

export function ModalAsyncState({ state, title, message, primaryAction, secondaryAction, correlationId }: {
  state: "loading" | "error";
  title: string;
  message: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  correlationId?: string | null;
}) {
  const Icon = state === "loading" ? LoaderCircle : CircleAlert;
  return (
    <section
      className={`modal-async-state modal-async-state--${state}`}
      role={state === "error" ? "alert" : "status"}
      aria-busy={state === "loading"}
    >
      <span className="modal-async-state__icon"><Icon aria-hidden="true" /></span>
      <div className="modal-async-state__copy">
        <h3>{title}</h3>
        <p>{message}</p>
        {correlationId && <small>Código de seguimiento: {correlationId}</small>}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="modal-async-state__actions">
          {secondaryAction && <button className="modal-async-state__secondary" type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
          {primaryAction && <button className="modal-async-state__primary" type="button" onClick={primaryAction.onClick}>{primaryAction.label}</button>}
        </div>
      )}
    </section>
  );
}
