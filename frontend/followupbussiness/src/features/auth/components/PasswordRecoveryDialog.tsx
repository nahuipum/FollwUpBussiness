import { useRef, type MouseEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogFocus } from "../../../shared/hooks/useDialogFocus";

type PasswordRecoveryDialogProps = {
  titleId: string;
  title: string;
  description: string;
  icon: ReactNode;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  onDismiss: () => void;
};

/** Token-only dialog: keeps FE-001's protected dialogs and styles untouched. */
export function PasswordRecoveryDialog({
  titleId,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  onDismiss,
}: PasswordRecoveryDialogProps) {
  const { dialogRef, initialFocusRef } = useDialogFocus(onDismiss);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismissOnOverlay = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.target === event.currentTarget &&
      event.currentTarget === overlayRef.current
    )
      onDismiss();
  };

  return (
    <div
      ref={overlayRef}
      className="recovery-modal-layer"
      onClick={dismissOnOverlay}
    >
      <section
        ref={dialogRef}
        className="recovery-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          className="recovery-modal-close"
          type="button"
          aria-label="Cerrar diálogo"
          onClick={onDismiss}
        >
          <X aria-hidden="true" />
        </button>
        <span className="recovery-modal-handle" aria-hidden="true" />
        <span className="recovery-modal-icon" aria-hidden="true">
          {icon}
        </span>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <button
          ref={initialFocusRef}
          className="submit-button primary-button recovery-modal-primary"
          type="button"
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </button>
        {secondaryAction && <button
          className="text-link recovery-modal-secondary"
          type="button"
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </button>}
      </section>
    </div>
  );
}
