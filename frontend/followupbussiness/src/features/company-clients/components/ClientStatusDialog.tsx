import { AlertTriangle, ArrowUpRight, ShieldCheck } from "lucide-react";
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
  const sellerCount = client.assignedSellerIds.length;
  return <ConfirmationDialog
    module="Clientes"
    className={`client-status${inactivate ? "" : " confirmation-dialog--reactivate"}`}
    titleId="client-status-title"
    title={`${action} cliente`}
    headerDescription="Confirma el cambio de estado."
    message={inactivate ? "El cliente quedará inactivo. No se eliminará ni se borrarán sus asignaciones o datos históricos." : "El cliente volverá a estar activo. Esta acción no crea asignaciones ni modifica la ubicación registrada."}
    icon={inactivate ? <AlertTriangle aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
    tone={inactivate ? "error" : "info"}
    identity={<><span className="confirmation-dialog__identity-mark">{initials(client.name)}</span><span className="confirmation-dialog__identity-copy"><strong>{client.name}</strong><small>{client.segment ?? "Sin segmento"} · {sellerCount} {sellerCount === 1 ? "vendedor asignado" : "vendedores asignados"}</small></span></>}
    note={inactivate ? <><ShieldCheck aria-hidden="true" /><span>Inactivar no equivale a eliminar el cliente.</span></> : undefined}
    busy={busy}
    busyLabel={inactivate ? "Inactivando…" : "Activando…"}
    error={error ? statusErrorMessage(error) : null}
    errorTitle={statusErrorTitle(error)}
    correlationId={error?.correlationId}
    cancelLabel="Cancelar"
    confirmLabel={`${action} cliente`}
    onCancel={onClose}
    onConfirm={onConfirm}
  />;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusErrorTitle(error: ApiError | null) {
  if (error?.status === 409) return "El cliente cambió durante la operación";
  if (error?.status === 403) return "No tienes permiso para esta operación";
  if (error?.status === 404) return "El cliente ya no está disponible";
  return "No pudimos cambiar el estado";
}

function statusErrorMessage(error: ApiError) {
  if (error.status === 403) return "No tienes permiso para cambiar el estado del cliente.";
  if (error.status === 404) return "El cliente ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
  if (error.status === 409) return "El cliente cambió mientras confirmabas. Actualiza la lista e inténtalo nuevamente.";
  return "No pudimos cambiar el estado del cliente. Inténtalo nuevamente.";
}
