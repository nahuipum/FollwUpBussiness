import { AlertTriangle } from "lucide-react";
import { useRef } from "react";
import { ModalSurface } from "./ModalSurface";
import "./operation-dialog.css";

export function ConfirmationDialog({
  titleId,
  title,
  message,
  cancelLabel = "Cancelar",
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  titleId: string;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <ModalSurface titleId={titleId} onDismiss={onCancel} className="confirmation-dialog" initialFocusRef={cancelRef}>
      <section className="confirmation-dialog__content">
        <span className="operation-dialog__icon operation-dialog__icon--warning"><AlertTriangle aria-hidden="true" /></span>
        <h2 id={titleId}>{title}</h2>
        <p>{message}</p>
      </section>
      <footer>
        <button ref={cancelRef} className="operation-dialog__secondary" type="button" onClick={onCancel}>{cancelLabel}</button>
        <button className="operation-dialog__primary" type="button" onClick={onConfirm}>{confirmLabel}</button>
      </footer>
    </ModalSurface>
  );
}
