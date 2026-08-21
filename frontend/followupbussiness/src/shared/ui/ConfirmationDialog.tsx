import { AlertTriangle } from "lucide-react";
import { useRef } from "react";
import { FormAlert } from "./FormAlert";
import { ModalHeader } from "./ModalHeader";
import { ModalSurface } from "./ModalSurface";
import "./operation-dialog.css";

export function ConfirmationDialog({
  titleId,
  title,
  message,
  module,
  icon,
  tone = "warning",
  busy = false,
  busyLabel,
  error,
  className,
  cancelLabel = "Cancelar",
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  titleId: string;
  title: string;
  message: string;
  module?: string;
  icon?: React.ReactNode;
  tone?: "warning" | "info" | "error";
  busy?: boolean;
  busyLabel?: string;
  error?: string | null;
  className?: string;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <ModalSurface titleId={titleId} onDismiss={onCancel} className={`confirmation-dialog${module ? " confirmation-dialog--with-header" : ""}${className ? ` ${className}` : ""}`} initialFocusRef={cancelRef} dismissOnEscape={!busy}>
      {module && <ModalHeader module={module} title={title} titleId={titleId} onClose={onCancel} closeLabel="Cerrar confirmación" closeDisabled={busy} />}
      <section className="confirmation-dialog__content">
        <span className={`operation-dialog__icon operation-dialog__icon--${tone}`}>{icon ?? <AlertTriangle aria-hidden="true" />}</span>
        {!module && <h2 id={titleId}>{title}</h2>}
        <p>{message}</p>
      </section>
      {error && <FormAlert>{error}</FormAlert>}
      <footer>
        <button ref={cancelRef} className="operation-dialog__secondary" type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button className="operation-dialog__primary" type="button" onClick={onConfirm} disabled={busy}>{busy ? (busyLabel ?? "Guardando…") : confirmLabel}</button>
      </footer>
    </ModalSurface>
  );
}
