import { FormAlert } from "../../../shared/ui/FormAlert";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { ApiError } from "../../../lib/api";
import type { Client } from "../types";

export function ClientStatusDialog({ client, busy, error, onClose, onConfirm }: {
  client: Client;
  busy: boolean;
  error: ApiError | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const inactivate = client.status === "ACTIVE";
  const action = inactivate ? "Inactivar" : "Activar";
  return (
    <ModalSurface titleId="client-status-title" onDismiss={onClose} className="client-status" dismissOnEscape={!busy}>
      <ModalHeader module="Clientes" title={`${action} cliente`} titleId="client-status-title" onClose={onClose} closeLabel="Cerrar confirmación" closeDisabled={busy} />
      <p>{`¿Deseas ${inactivate ? "inactivar" : "activar"} a ${client.name}? Su estado cambiará a ${inactivate ? "Inactivo" : "Activo"}.`}</p>
      {error && <FormAlert>{statusErrorMessage(error)}</FormAlert>}
      <footer>
        <button className="client-form__secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
        <button className="client-form__primary" type="button" onClick={onConfirm} disabled={busy}>{busy ? "Guardando…" : `${action} cliente`}</button>
      </footer>
    </ModalSurface>
  );
}

function statusErrorMessage(error: ApiError) {
  if (error.status === 403) return "No tienes permiso para cambiar el estado del cliente.";
  if (error.status === 404) return "El cliente ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
  if (error.status === 409) return "El cliente cambió mientras confirmabas. Actualiza la lista e inténtalo nuevamente.";
  return "No pudimos cambiar el estado del cliente. Inténtalo nuevamente.";
}
