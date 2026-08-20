import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import type { Client, ClientFormTarget } from "../types";
import { ClientLocationMap } from "./ClientLocationMap";

export function ClientDetailDialog({ target, client, loading, error, territoryLabel, onRetry, onClose }: {
  target: Client;
  client: ClientFormTarget | null;
  loading: boolean;
  error: boolean;
  territoryLabel: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <ModalSurface titleId="client-detail-title" onDismiss={onClose} className="client-detail">
      <ModalHeader module="Clientes" title="Detalle de cliente" titleId="client-detail-title" onClose={onClose} closeLabel="Cerrar detalle" />
      {loading ? <ModalAsyncState state="loading" title="Cargando cliente" message="Estamos obteniendo la información más reciente." />
        : error || !client ? <ModalAsyncState state="error" title="No pudimos cargar el cliente" message="No logramos obtener la información actual. Reintenta en unos segundos." primaryAction={{ label: "Reintentar", onClick: onRetry }} secondaryAction={{ label: "Cerrar", onClick: onClose }} />
        : <dl>
          <Detail label="Nombre" value={client.name} />
          <Detail label="Estado" value={client.status === "ACTIVE" ? "Activo" : "Inactivo"} />
          <Detail label="Tipo de documento" value={client.documentType} />
          <Detail label="Número de documento" value={client.documentNumber} />
          <Detail label="Teléfono" value={client.phone} />
          <Detail label="Email" value={client.email} />
          <Detail label="Segmento" value={client.segment} />
          <Detail label="Frecuencia de visita" value={client.visitFrequencyDays ? `Cada ${client.visitFrequencyDays} días` : null} />
          <Detail label="Territorio" value={territoryLabel} />
          <Detail label="Vendedores asignados" value={String(client.assignedSellerIds.length)} />
          <div className="client-detail__wide"><dt>Dirección</dt><dd>{client.address}</dd></div>
        </dl>}
      {client && !loading && !error && <ClientLocationMap latitude={client.location.latitude} longitude={client.location.longitude} readOnly />}
      {client && !loading && !error && <footer><button className="client-form__secondary" type="button" onClick={onClose}>Cerrar</button></footer>}
      <span className="sr-only">Cliente seleccionado: {target.name}</span>
    </ModalSurface>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;
}
