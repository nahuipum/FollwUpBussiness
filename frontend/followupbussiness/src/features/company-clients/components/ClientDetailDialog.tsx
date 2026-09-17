import { MapPin } from "lucide-react";
import { DataTableIdentity, DataTableStatus } from "../../../shared/ui/DataTable";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import type { Client, ClientFormTarget } from "../types";
import { ClientLocationMap } from "./ClientLocationMap";

export function ClientDetailDialog({ target, client, loading, error, territoryLabel, onRetry, onClose }: { target: Client; client: ClientFormTarget | null; loading: boolean; error: boolean; territoryLabel: string | null; onRetry: () => void; onClose: () => void }) {
  const ready = client && !loading && !error;
  return <DrawerSurface
    titleId="client-detail-title"
    descriptionId="client-detail-description"
    onDismiss={onClose}
    className="client-detail"
    header={<ModalHeader module="Clientes" title="Detalle de cliente" titleId="client-detail-title" descriptionId="client-detail-description" description="Información actual del registro seleccionado." onClose={onClose} closeLabel="Cerrar detalle" />}
    footer={ready ? <button className="client-form__secondary" type="button" onClick={onClose}>Cerrar</button> : undefined}
  >
    {loading ? <ModalAsyncState state="loading" title="Cargando cliente" message="Estamos obteniendo la información más reciente." />
      : error || !client ? <ModalAsyncState state="error" title="No pudimos cargar el cliente" message="No logramos obtener la información actual. Reintenta en unos segundos." primaryAction={{ label: "Reintentar", onClick: onRetry }} secondaryAction={{ label: "Cerrar", onClick: onClose }} />
      : <div className="client-detail__body">
        <DataTableIdentity mark={initials(client.name)} primary={client.name} secondary={`Cliente ${client.status === "ACTIVE" ? "activo" : "inactivo"} de la cartera comercial`} />
        <dl className="client-detail__grid">
          <Detail label="Nombre" value={client.name} />
          <div><dt>Estado</dt><dd><DataTableStatus label={client.status === "ACTIVE" ? "Activo" : "Inactivo"} tone={client.status === "ACTIVE" ? "success" : "danger"} /></dd></div>
          <Detail label="Tipo de documento" value={client.documentType} />
          <Detail label="Número de documento" value={client.documentNumber} />
          <Detail label="Teléfono" value={client.phone} />
          <Detail label="Email" value={client.email} />
          <Detail label="Segmento" value={client.segment} />
          <Detail label="Frecuencia de visita" value={client.visitFrequencyDays ? `Cada ${client.visitFrequencyDays} días` : null} />
          <Detail label="Territorio" value={territoryLabel} />
          <Detail label="Vendedores asignados" value={String(client.assignedSellerIds.length)} />
          <div className="client-detail__wide"><dt>Dirección</dt><dd>{client.address}</dd></div>
        </dl>
        <section className="client-detail__location" aria-labelledby="client-detail-map-title"><div className="client-form__section-heading"><span className="client-form__section-icon"><MapPin aria-hidden="true" /></span><div><h3 id="client-detail-map-title">Ubicación registrada</h3><p>Mapa de solo lectura.</p></div></div><ClientLocationMap latitude={client.location.latitude} longitude={client.location.longitude} readOnly /></section>
      </div>}
    <span className="sr-only">Cliente seleccionado: {target.name}</span>
  </DrawerSurface>;
}

function Detail({ label, value }: { label: string; value: string | null }) { return <div><dt>{label}</dt><dd>{value || "—"}</dd></div>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
