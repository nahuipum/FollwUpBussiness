import { createPortal } from "react-dom";
import { useDialogFocus } from "../hooks/useDialogFocus";
import type { ReactNode, RefObject } from "react";
import "./drawer-surface.css";

type DrawerSurfaceProps = {
  titleId: string;
  descriptionId?: string;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onDismiss: () => void;
  busy?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
};

/** A right-side dialog with an independently scrolling body and fixed actions. */
export function DrawerSurface({
  titleId,
  descriptionId,
  header,
  children,
  footer,
  onDismiss,
  busy = false,
  initialFocusRef,
  className,
}: DrawerSurfaceProps) {
  const dismiss = () => {
    if (!busy) onDismiss();
  };
  const { dialogRef } = useDialogFocus(dismiss, initialFocusRef, !busy);

  return createPortal(
    <div className="drawer-surface-layer">
      <div className="drawer-surface__scrim" aria-hidden="true" onMouseDown={dismiss} />
      <section
        ref={dialogRef}
        tabIndex={-1}
        className={`drawer-surface${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="drawer-surface__header">{header}</header>
        <div className="drawer-surface__body">{children}</div>
        {footer && <footer className="drawer-surface__footer">{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
}
