import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { ApiError } from "../../../lib/api";
import { routeLabel } from "../route-label";
import type { Route } from "../types";
import { RouteReadOnlySequence } from "./RouteReadOnlySequence";

const statusLabels = { DRAFT: "Borrador", PUBLISHED: "Publicada", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" } as const;
export function RouteDetailDialog({ target, route, sellerLabel, sellerAvailable, loading, error, canGenerateProposal, canPublish, onGenerateProposal, onPublish, onRetry, onClose }: { target: Route; route: Route | null; sellerLabel: string; sellerAvailable: boolean; loading: boolean; error: ApiError | null; canGenerateProposal: boolean; canPublish: boolean; onGenerateProposal: (route: Route) => void; onPublish: (route: Route) => void; onRetry: () => void; onClose: () => void }) {
  return <ModalSurface titleId="route-detail-title" onDismiss={onClose} className="route-detail route-detail--viewer"><ModalHeader module="Rutas" title="Detalle de ruta" titleId="route-detail-title" onClose={onClose} closeLabel="Cerrar detalle" />
    {loading ? <ModalAsyncState state="loading" title="Cargando ruta" message="Estamos obteniendo la información más reciente." /> : error || !route ? <ModalAsyncState state="error" title={error?.status === 403 || error?.status === 404 ? "No podemos mostrar esta ruta" : "No pudimos cargar la ruta"} message={error?.status === 403 || error?.status === 404 ? "La ruta ya no está disponible para tu sesión." : "No logramos obtener la información actual. Reintenta en unos segundos."} primaryAction={{ label: "Reintentar", onClick: onRetry }} secondaryAction={{ label: "Cerrar", onClick: onClose }} {...(error?.correlationId ? { correlationId: error.correlationId } : {})} /> : <><dl><Detail label="Fecha" value={route.date} /><Detail label="Ruta" value={routeLabel(route)} /><Detail label="Vendedor" value={sellerLabel} /><Detail label="Estado" value={statusLabels[route.status]} /></dl><RouteReadOnlySequence route={route} /><footer><button className="route-list__secondary" type="button" onClick={onClose}>Cerrar</button>{canGenerateProposal && route.status === "DRAFT" && <button className="route-list__secondary" type="button" onClick={() => { onClose(); onGenerateProposal(route); }}>Generar propuesta</button>}{canPublish && route.status === "DRAFT" && sellerAvailable && <button className="route-list__primary" type="button" onClick={() => onPublish(route)}>Publicar ruta</button>}</footer></>}
    <span className="sr-only">Ruta seleccionada: {routeLabel(target)}</span>
  </ModalSurface>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
