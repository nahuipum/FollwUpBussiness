import { Copy } from "lucide-react";
import "../styles/error-ui.css";

type CorrelationIdProps = {
  correlationId: string;
  copyLabel?: string;
  onCopy?: () => void;
};

export function CorrelationId({ correlationId, copyLabel = "Copiar Correlation ID", onCopy }: CorrelationIdProps) {
  return (
    <div className="error-ui-correlation">
      <code>Correlation ID: {correlationId}</code>
      <button type="button" className="error-ui-correlation__copy" aria-label={copyLabel} onClick={onCopy}>
        <Copy aria-hidden="true" />
      </button>
    </div>
  );
}
