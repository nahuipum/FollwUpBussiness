import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import { Button } from "../../../shared/ui/Button";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { useRef } from "react";
import type { ApiError } from "../../../lib/api";
import { formatRouteDate, routeLabel } from "../route-label";
import type { Route } from "../types";
import { RouteReadOnlySequence } from "./RouteReadOnlySequence";

const statusLabels = { DRAFT: "Borrador", PUBLISHED: "Publicada", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" } as const;
type Props = { target: Route; route: Route | null; sellerLabel: string; sellerAvailable: boolean; loading: boolean; error: ApiError | null; canManage?: boolean; canGenerateProposal?: boolean; canPublish?: boolean; onEditOrder?: (route: Route) => void; onGenerateProposal: (route: Route) => void; onPublish: (route: Route) => void; onRetry: () => void; onClose: () => void };

export function RouteDetailDialog({ target, route, sellerLabel, sellerAvailable, loading, error, canManage, canGenerateProposal, canPublish, onEditOrder, onGenerateProposal, onPublish, onRetry, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const mayManage = canManage ?? Boolean(canGenerateProposal || canPublish);
  const footer = route ? <><Button onClick={onClose}>Cerrar</Button>{mayManage && onEditOrder && (route.status === "DRAFT" || route.status === "PUBLISHED") && <Button onClick={() => { onClose(); onEditOrder(route); }}>Editar orden</Button>}{(canManage ?? canGenerateProposal) && route.status === "DRAFT" && <Button onClick={() => { onClose(); onGenerateProposal(route); }}>Generar propuesta</Button>}{(canManage ?? canPublish) && route.status === "DRAFT" && sellerAvailable && <Button variant="primary" onClick={() => onPublish(route)}>Publicar ruta</Button>}</> : <Button onClick={onClose}>Cerrar</Button>;
  return <DrawerSurface titleId="route-detail-title" onDismiss={onClose} initialFocusRef={closeRef} className="route-detail-drawer" header={<ModalHeader module="Rutas" title="Detalle de ruta" titleId="route-detail-title" description="Información vigente y secuencia accesible." onClose={onClose} closeLabel="Cerrar detalle" closeRef={closeRef} />} footer={footer}>
    {loading ? <ModalAsyncState state="loading" title="Cargando ruta" message="Estamos obteniendo la información más reciente." /> : error || !route ? <ModalAsyncState state="error" title={error?.status === 403 || error?.status === 404 ? "No podemos mostrar esta ruta" : "No pudimos cargar la ruta"} message={error?.status === 403 || error?.status === 404 ? "La ruta ya no está disponible para tu sesión." : "No logramos obtener la información actual. Reintenta en unos segundos."} primaryAction={{ label: "Reintentar", onClick: onRetry }} secondaryAction={{ label: "Cerrar", onClick: onClose }} {...(error?.correlationId ? { correlationId: error.correlationId } : {})} /> : <>
      <div className="route-detail-hero"><div><h3>{routeLabel(route)}</h3><p>Planificación del {formatLongRouteDate(route.date)}</p></div><span className={`route-badge route-badge--${route.status === "PUBLISHED" ? "success" : route.status === "DRAFT" ? "neutral" : "warning"}`}>{statusLabels[route.status]}</span></div>
      {route.status === "PUBLISHED" && mayManage && <div className="route-inline-notice route-inline-notice--warning"><strong>Ruta publicada</strong><p>Solo se puede cambiar el orden de los mismos puntos mientras la jornada lo permita.</p></div>}
      {!['DRAFT', 'PUBLISHED'].includes(route.status) && <div className="route-inline-notice"><strong>Ruta de solo lectura</strong><p>El orden no puede modificarse en este estado.</p></div>}
      <dl className="route-definition route-detail-summary"><Detail label="Fecha" value={formatRouteDate(route.date)} /><Detail label="Vendedor" value={sellerLabel} /><Detail label="Versión" value={String(route.version)} /><Detail label="Puntos" value={`${route.points.length} visitas`} /><Detail label="Estado" value={statusLabels[route.status]} /></dl>
      <RouteReadOnlySequence route={route} layout="stacked" mapPosition="bottom" compactMap />
    </>}
    <span className="sr-only">Ruta seleccionada: {routeLabel(target)}</span>
  </DrawerSurface>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }

function formatLongRouteDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)).replace("setiembre", "septiembre");
}
