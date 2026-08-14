import { createPortal } from "react-dom";
import { useDialogFocus } from "../hooks/useDialogFocus";
import type { ReactNode } from "react";
import "./modal-surface.css";

type ModalSurfaceProps = { titleId: string; children: ReactNode; onDismiss: () => void; className?: string };

export function ModalSurface({ titleId, children, onDismiss, className }: ModalSurfaceProps) {
  const { dialogRef } = useDialogFocus(onDismiss);
  return createPortal(<div className="modal-surface-layer"><section ref={dialogRef} className={`modal-surface${className ? ` ${className}` : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>{children}</section></div>, document.body);
}
