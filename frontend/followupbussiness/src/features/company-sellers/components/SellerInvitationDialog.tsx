import { Send, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useDialogFocus } from "../../../shared/hooks/useDialogFocus";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { SellerOperationDialog } from "./SellerOperationDialog";
import type { ApiError } from "../../../lib/api";
import type { Seller } from "../types";

function errorMessage(error: ApiError | null) {
  if (!error) return null;
  switch (error.status) {
    case 403:
      return "No tienes permiso para reenviar esta invitación.";
    case 404:
      return "El vendedor ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
    case 409:
      return "La invitación cambió mientras confirmabas. Actualiza la lista antes de reintentar.";
    default:
      return "No pudimos reenviar la invitación. Inténtalo nuevamente.";
  }
}

export function SellerInvitationDialog({
  seller,
  busy,
  success,
  error,
  onClose,
  onConfirm,
}: {
  seller: Seller;
  busy: boolean;
  success: boolean;
  error: ApiError | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (success) return <SellerOperationDialog tone="success" title="Invitación reenviada" message={`La nueva entrega de invitación fue aceptada para ${seller.displayName}.`} onClose={onClose} />;
  return <SellerInvitationConfirmationDialog seller={seller} busy={busy} error={error} onClose={onClose} onConfirm={onConfirm} />;
}

function SellerInvitationConfirmationDialog({
  seller,
  busy,
  error,
  onClose,
  onConfirm,
}: Omit<Parameters<typeof SellerInvitationDialog>[0], "success">) {
  const { dialogRef, initialFocusRef } = useDialogFocus(onClose);
  useEffect(() => {
    initialFocusRef.current?.focus();
  }, [initialFocusRef]);
  const message = errorMessage(error);
  return createPortal(
    <div className="modal-surface-layer">
      <section
        ref={dialogRef}
        className="modal-surface seller-list__dialog seller-list__invitation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-invitation-title"
        aria-describedby="seller-invitation-description"
      >
        <header className="seller-list__invitation-header"><h2 id="seller-invitation-title">Reenviar invitación</h2><button type="button" aria-label="Cerrar reenvío de invitación" onClick={onClose} disabled={busy}><X aria-hidden="true" /></button></header>
        <section className="seller-list__invitation-content">
            <span className="seller-list__invitation-icon" aria-hidden="true"><Send /></span>
            <p id="seller-invitation-description">
              ¿Deseas reenviar la invitación a {seller.displayName}? La entrega se procesará de forma asíncrona.
            </p>
        </section>
        {message && <FormAlert>{message}</FormAlert>}
        <footer>
          <button ref={initialFocusRef} className="seller-list__secondary" type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="seller-list__primary" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? "Reenviando…" : "Reenviar invitación"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
