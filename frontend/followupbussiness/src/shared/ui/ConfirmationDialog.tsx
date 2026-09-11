import { AlertTriangle } from "lucide-react";
import { useRef, type ReactNode, type RefObject } from "react";
import { CorrelationId } from "./error-ui/components/CorrelationId";
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
  confirmDisabled = false,
  busyLabel,
  error,
  className,
  cancelLabel = "Cancelar",
  confirmLabel,
  onCancel,
  onConfirm,
  returnFocusRef,
  appearance = "default",
  descriptionId,
  bodyTitle,
  identity,
  note,
  details,
  correlationId,
  headerDescription,
  errorTitle = "No pudimos actualizar al usuario",
}: {
  titleId: string;
  title: string;
  message: string;
  module?: string;
  icon?: React.ReactNode;
  tone?: "warning" | "info" | "error";
  busy?: boolean;
  confirmDisabled?: boolean;
  busyLabel?: string;
  error?: string | null;
  className?: string | undefined;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  appearance?: "default" | "golden";
  descriptionId?: string;
  bodyTitle?: string;
  identity?: ReactNode;
  note?: ReactNode;
  details?: ReactNode;
  correlationId?: string | null | undefined;
  headerDescription?: string;
  errorTitle?: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <ModalSurface titleId={titleId} descriptionId={descriptionId} onDismiss={onCancel} appearance={appearance === "golden" ? "bottom-sheet" : "default"} className={`confirmation-dialog confirmation-dialog--${appearance}${module ? " confirmation-dialog--with-header" : ""}${className ? ` ${className}` : ""}`} initialFocusRef={cancelRef} dismissOnEscape={!busy} dismissOnBackdrop={appearance === "golden" && !busy} role="alertdialog" {...(returnFocusRef ? { returnFocusRef } : {})}>
      {module && <ModalHeader module={module} title={title} titleId={titleId} {...(headerDescription ? { description: headerDescription } : {})} onClose={onCancel} closeLabel="Cerrar confirmación" closeDisabled={busy} />}
      <section className="confirmation-dialog__content">
        <span className={`operation-dialog__icon operation-dialog__icon--${tone}`}>{icon ?? <AlertTriangle aria-hidden="true" />}</span>
        {!module && <h2 id={titleId}>{title}</h2>}
        {identity && <div className="confirmation-dialog__identity">{identity}</div>}
        {bodyTitle && <h3>{bodyTitle}</h3>}
        <p id={descriptionId}>{message}</p>
        {note && <div className="confirmation-dialog__note">{note}</div>}
        {error && appearance === "golden" && <div className="confirmation-dialog__error" role="alert"><AlertTriangle aria-hidden="true" /><div><strong>{errorTitle}</strong><p>{error}</p>{correlationId && <CorrelationId correlationId={correlationId} />}</div></div>}
        {details && <div className="confirmation-dialog__details">{details}</div>}
      </section>
      {error && appearance === "default" && <FormAlert>{error}{correlationId && <CorrelationId correlationId={correlationId} />}</FormAlert>}
      <footer>
        <button ref={cancelRef} className="operation-dialog__secondary" type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button className="operation-dialog__primary" type="button" onClick={onConfirm} disabled={busy || confirmDisabled}>{busy && <span className="confirmation-dialog__spinner" aria-hidden="true" />}{busy ? (busyLabel ?? "Guardando…") : confirmLabel}</button>
      </footer>
    </ModalSurface>
  );
}
