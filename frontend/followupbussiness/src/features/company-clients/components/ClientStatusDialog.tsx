import { Power } from "lucide-react";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
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
  return <ConfirmationDialog
    module="Clientes"
    className="client-status"
    titleId="client-status-title"
    title={`${action} cliente`}
    message={`¿Deseas ${inactivate ? "inactivar" : "activar"} a ${client.name}? Su estado cambiará a ${inactivate ? "Inactivo" : "Activo"}.`}
    icon={<Power aria-hidden="true" />}
    tone={inactivate ? "warning" : "info"}
    busy={busy}
    busyLabel="Guardando…"
    error={error ? statusErrorMessage(error) : null}
    cancelLabel="Cancelar"
    confirmLabel={`${action} cliente`}
    onCancel={onClose}
    onConfirm={onConfirm}
  />;
}

function statusErrorMessage(error: ApiError) {
  if (error.status === 403) return "No tienes permiso para cambiar el estado del cliente.";
  if (error.status === 404) return "El cliente ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
  if (error.status === 409) return "El cliente cambió mientras confirmabas. Actualiza la lista e inténtalo nuevamente.";
  return "No pudimos cambiar el estado del cliente. Inténtalo nuevamente.";
}
