import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useRef } from "react";
import { ModalSurface } from "./ModalSurface";
import "./operation-dialog.css";

type Tone = "success" | "error" | "warning" | "info";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export function OperationDialog({
  titleId,
  tone,
  title,
  message,
  onClose,
  primaryLabel = "Aceptar",
  onPrimary = onClose,
  secondaryLabel,
  onSecondary,
}: {
  titleId: string;
  tone: Tone;
  title: string;
  message: string;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const Icon = icons[tone];
  return (
    <ModalSurface titleId={titleId} onDismiss={onClose} className="operation-dialog" initialFocusRef={primaryRef}>
      <header className="operation-dialog__close">
        <button type="button" aria-label="Cerrar mensaje" onClick={onClose}><X aria-hidden="true" /></button>
      </header>
      <section className="operation-dialog__content">
        <span className={`operation-dialog__icon operation-dialog__icon--${tone}`}><Icon aria-hidden="true" /></span>
        <h2 id={titleId}>{title}</h2>
        <p role={tone === "error" || tone === "warning" ? "alert" : "status"}>{message}</p>
      </section>
      <footer>
        {secondaryLabel && onSecondary && <button className="operation-dialog__secondary" type="button" onClick={onSecondary}>{secondaryLabel}</button>}
        <button ref={primaryRef} className="operation-dialog__primary" type="button" onClick={onPrimary}>{primaryLabel}</button>
      </footer>
    </ModalSurface>
  );
}
