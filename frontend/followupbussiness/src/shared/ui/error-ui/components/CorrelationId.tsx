import { useState } from "react";
import { Copy } from "lucide-react";
import { safeCorrelationId } from "../../../../lib/api";
import "../styles/error-ui.css";

type CorrelationIdProps = {
  correlationId: string;
};

export function CorrelationId({ correlationId }: CorrelationIdProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const validCorrelationId = safeCorrelationId(correlationId);

  if (validCorrelationId === null) return null;
  const correlationIdToCopy: string = validCorrelationId;

  async function copyCorrelationId() {
    if (navigator.clipboard?.writeText === undefined) {
      setCopyStatus("No fue posible copiar el ID de seguimiento.");
      return;
    }

    try {
      await navigator.clipboard.writeText(correlationIdToCopy);
      setCopyStatus("ID de seguimiento copiado.");
    } catch {
      setCopyStatus("No fue posible copiar el ID de seguimiento.");
    }
  }

  return (
    <div className="error-ui-correlation">
      <code>Correlation ID: {correlationIdToCopy}</code>
      <button type="button" className="error-ui-correlation__copy" aria-label="Copiar ID de seguimiento" onClick={() => void copyCorrelationId()}>
        <Copy aria-hidden="true" />
      </button>
      {copyStatus && <span className="sr-only" role="status">{copyStatus}</span>}
    </div>
  );
}
