import { createPortal } from "react-dom";
import { useDialogFocus } from "../hooks/useDialogFocus";
import type { ReactNode, RefObject } from "react";
import "./modal-surface.css";
import "./modal-scrollbar.css";

type ModalSurfaceProps = { titleId: string; children: ReactNode; onDismiss: () => void; className?: string; initialFocusRef?: RefObject<HTMLElement | null>; dismissOnEscape?: boolean };

export function ModalSurface({ titleId, children, onDismiss, className, initialFocusRef, dismissOnEscape = true }: ModalSurfaceProps) {
  const { dialogRef } = useDialogFocus(onDismiss, initialFocusRef, dismissOnEscape);
  return createPortal(<div className="modal-surface-layer"><section ref={dialogRef} tabIndex={-1} className={`modal-surface${className ? ` ${className}` : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>{children}</section></div>, document.body);
}
