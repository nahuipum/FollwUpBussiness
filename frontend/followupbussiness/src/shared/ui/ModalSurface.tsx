import { createPortal } from "react-dom";
import { useDialogFocus } from "../hooks/useDialogFocus";
import type { ReactNode, RefObject } from "react";
import "./modal-surface.css";
import "./modal-scrollbar.css";

type ModalSurfaceProps = { titleId: string; descriptionId?: string | undefined; children: ReactNode; onDismiss: () => void; className?: string; initialFocusRef?: RefObject<HTMLElement | null>; dismissOnEscape?: boolean; dismissOnBackdrop?: boolean; role?: "dialog" | "alertdialog"; returnFocusRef?: RefObject<HTMLElement | null>; appearance?: "default" | "bottom-sheet" };

export function ModalSurface({ titleId, descriptionId, children, onDismiss, className, initialFocusRef, dismissOnEscape = true, dismissOnBackdrop = false, role = "dialog", returnFocusRef, appearance = "default" }: ModalSurfaceProps) {
  const { dialogRef } = useDialogFocus(onDismiss, initialFocusRef, dismissOnEscape, returnFocusRef);
  return createPortal(<div className={`modal-surface-layer modal-surface-layer--${appearance}`} onMouseDown={(event) => { if (dismissOnBackdrop && event.target === event.currentTarget) onDismiss(); }}><section ref={dialogRef} tabIndex={-1} className={`modal-surface${className ? ` ${className}` : ""}`} role={role} aria-modal="true" aria-labelledby={titleId} {...(descriptionId ? { "aria-describedby": descriptionId } : {})}>{children}</section></div>, document.body);
}
