import { Send } from "lucide-react";
import type { ApiError } from "../../../lib/api";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import type { Seller } from "../types";
import { SellerOperationDialog } from "./SellerOperationDialog";

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
  if (success) {
    return (
      <SellerOperationDialog
        tone="success"
        title="Invitación aceptada para entrega"
        message={`La nueva entrega de invitación para ${seller.displayName} fue aceptada. El correo se procesará de forma asíncrona.`}
        onClose={onClose}
      />
    );
  }

  return (
    <ConfirmationDialog
      appearance="golden"
      className="confirmation-dialog--info"
      titleId="seller-invitation-title"
      descriptionId="seller-invitation-description"
      module="Vendedores"
      title="Reenviar invitación"
      headerDescription="Confirma la solicitud de una nueva entrega."
      identity={<SellerIdentity seller={seller} />}
      message="Se invalidará el enlace de activación anterior y se encolará una nueva invitación para entrega."
      icon={<Send aria-hidden="true" />}
      tone="info"
      busy={busy}
      busyLabel="Reenviando…"
      error={errorMessage(error)}
      errorTitle="No pudimos reenviar la invitación"
      correlationId={error?.correlationId}
      confirmLabel="Reenviar invitación"
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
}

function SellerIdentity({ seller }: { seller: Seller }) { return <><span className="confirmation-dialog__identity-mark">{seller.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="confirmation-dialog__identity-copy"><strong>{seller.displayName}</strong><small>{seller.email ?? "Sin correo registrado"}</small></span></>; }
