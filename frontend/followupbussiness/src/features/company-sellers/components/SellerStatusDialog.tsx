import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { useDialogFocus } from "../../../shared/hooks/useDialogFocus";
import { FormAlert } from "../../../shared/ui/FormAlert";
import type { ApiError } from "../../../lib/api";
import type { Seller } from "../types";

function errorMessage(error: ApiError | null) {
  if (!error) return null;
  switch (error.status) {
    case 400:
      return "Revisa el motivo e inténtalo nuevamente.";
    case 403:
      return "No tienes permiso para realizar esta acción.";
    case 404:
      return "El vendedor ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
    case 409:
      return "El estado cambió mientras confirmabas. Revisa el motivo y vuelve a intentarlo.";
    default:
      return "No pudimos actualizar el estado. Inténtalo nuevamente.";
  }
}

export function SellerStatusDialog({
  seller,
  reason,
  busy,
  error,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  seller: Seller;
  reason: string;
  busy: boolean;
  error: ApiError | null;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { dialogRef } = useDialogFocus(onClose);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    reasonRef.current?.focus();
  }, []);
  const inactive = seller.status === "ACTIVE";
  const action = inactive ? "Inactivar" : "Activar";
  const normalizedReason = reason.trim();
  const reasonInvalid = reason.length > 0 && (normalizedReason.length < 5 || normalizedReason.length > 500);
  const message = errorMessage(error);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reasonInvalid && normalizedReason.length >= 5 && !busy) onConfirm();
  };

  return createPortal(
    <div className="modal-surface-layer">
      <section
        ref={dialogRef}
        className="modal-surface seller-list__dialog seller-list__status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-status-title"
        aria-describedby="seller-status-description"
      >
        <form onSubmit={submit}>
          <header>
            <h2 id="seller-status-title">{action} vendedor</h2>
          </header>
          <p id="seller-status-description">
            {inactive
              ? `Inactivarás a ${seller.displayName}. Se revocará su acceso y no tendrá nuevas rutas.`
              : `¿Deseas activar a ${seller.displayName}? Esta acción no restaura sesiones, rutas ni asignaciones previas.`}
          </p>
          <label htmlFor="seller-status-reason">
            Motivo del cambio
            <textarea
              ref={reasonRef}
              id="seller-status-reason"
              value={reason}
              minLength={5}
              maxLength={500}
              required
              disabled={busy}
              aria-invalid={reasonInvalid}
              aria-describedby="seller-status-reason-help seller-status-reason-error"
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </label>
          <p id="seller-status-reason-help" className="seller-list__hint">
            Entre 5 y 500 caracteres.
          </p>
          {reasonInvalid && (
            <FormAlert>
              <span id="seller-status-reason-error">
              El motivo debe tener entre 5 y 500 caracteres.
              </span>
            </FormAlert>
          )}
          {message && <FormAlert>{message}</FormAlert>}
          <footer>
            <button className="seller-list__secondary" type="button" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button className="seller-list__primary" type="submit" disabled={busy || normalizedReason.length < 5 || normalizedReason.length > 500}>
              {busy ? "Guardando…" : `${action} vendedor`}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
