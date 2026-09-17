import { X } from "lucide-react";
import type { ReactNode, Ref } from "react";
import "./modal-header.css";

type Props = {
  module: string;
  title: ReactNode;
  titleId: string;
  description?: ReactNode;
  descriptionId?: string;
  onClose?: () => void;
  closeLabel?: string;
  closeDisabled?: boolean;
  closeRef?: Ref<HTMLButtonElement>;
  className?: string;
};

export function ModalHeader({
  module,
  title,
  titleId,
  description,
  descriptionId,
  onClose,
  closeLabel = "Cerrar modal",
  closeDisabled = false,
  closeRef,
  className,
}: Props) {
  const classes = ["shared-modal-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="shared-modal-header__titles">
        <span className="shared-modal-header__module">{module}</span>
        <h2 id={titleId}>{title}</h2>
        {description && (
          <p id={descriptionId} className="shared-modal-header__description">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          ref={closeRef}
          className="shared-modal-header__close"
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          disabled={closeDisabled}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </header>
  );
}
