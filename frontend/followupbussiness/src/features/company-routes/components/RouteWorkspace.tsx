import { Copy, Edit3, Eye, MoreVertical, Send, Sparkles } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { DataTablePagination } from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import { formatRouteDate, routeLabel } from "../route-label";
import type { Route, RouteSellerOption, RouteStatus } from "../types";
import { RouteSequenceMap } from "./RouteSequenceMap";
import { useRouteDirections } from "../hooks/useRouteDirections";

const labels: Record<RouteStatus, string> = { DRAFT: "Borrador", PUBLISHED: "Publicada", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" };
const tones: Record<RouteStatus, string> = { DRAFT: "neutral", PUBLISHED: "success", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "danger" };

const SelectedRouteMap = memo(function SelectedRouteMap({ route }: { route: Route }) {
  const directions = useRouteDirections(route);
  const points = useMemo(() => [...route.points].sort((a, b) => a.sequence - b.sequence), [route.points]);
  return <RouteSequenceMap points={points} {...directions} variant="embedded" />;
});

export function RouteWorkspace({ routes, sellers, page, pageSize, totalPages, totalElements, canManage, onDetail, onOrder, onProposal, onPublish, onCopy, onPageChange }: { routes: readonly Route[]; sellers: readonly RouteSellerOption[]; page: number; pageSize: DataTablePageSize; totalPages: number; totalElements: number; canManage: boolean; onDetail: (route: Route) => void; onOrder: (route: Route) => void; onProposal: (route: Route) => void; onPublish: (route: Route) => void; onCopy?: (route: Route) => void; onPageChange: (page: number) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(routes[0]?.id ?? null);
  const [menuRoute, setMenuRoute] = useState<Route | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const selected = routes.find((route) => route.id === selectedId) ?? routes[0] ?? null;
  const seller = (route: Route) => sellers.find((item) => item.id === route.sellerId)?.label ?? "Vendedor no disponible";
  const isExpiredDraft = (route: Route) => route.status === "DRAFT" && route.publicationEligibility?.reason === "OPERATIONAL_DATE_EXPIRED";
  const mayPublish = (route: Route) => route.status === "DRAFT" && route.publicationEligibility?.eligible !== false;
  const menuItems = (route: Route) => [
    { label: "Ver detalle", icon: <Eye aria-hidden="true" />, onSelect: () => onDetail(route) },
    ...(canManage && onCopy ? [{ label: "Copiar ruta", icon: <Copy aria-hidden="true" />, onSelect: () => onCopy(route) }] : []),
    ...((route.status === "DRAFT" || route.status === "PUBLISHED") && canManage ? [{ label: "Editar orden", icon: <Edit3 aria-hidden="true" />, onSelect: () => onOrder(route) }] : []),
    ...(route.status === "DRAFT" && canManage ? [{ label: "Generar propuesta", icon: <Sparkles aria-hidden="true" />, onSelect: () => onProposal(route) }, ...(mayPublish(route) ? [{ label: "Publicar ruta", icon: <Send aria-hidden="true" />, onSelect: () => onPublish(route) }] : [])] : []),
  ];
  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(totalElements, page * pageSize + routes.length);
  return <section className="route-workspace-content" aria-label="Planificación y consulta de rutas">
    <div className="route-mobile-toggle" aria-label="Alternar vista"><Button size="compact" variant={mobileView === "list" ? "primary" : "secondary"} aria-pressed={mobileView === "list"} onClick={() => setMobileView("list")}>Rutas</Button><Button size="compact" variant={mobileView === "map" ? "primary" : "secondary"} aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}>Mapa</Button></div>
    <div className={`route-workspace route-workspace--${mobileView}`}>
      <section className="route-map-region" aria-labelledby="routes-map-title"><header><div><h2 id="routes-map-title">Mapa de rutas</h2><p>La selección del panel se refleja en el mapa.</p></div><span className="route-map-status">Recorrido vial cuando está disponible</span></header>{selected ? <SelectedRouteMap route={selected} /> : <p>No hay una ruta seleccionada.</p>}</section>
      <aside className="route-rail" aria-label="Panel de rutas"><header><div><span className="route-eyebrow">Resultados</span><h2>Rutas del día</h2><p>Información vigente del alcance autorizado</p></div><strong>{totalElements}</strong></header><div className="route-card-list">{routes.map((route) => <article key={route.id} className={`route-card${route.id === selected?.id ? " route-card--selected" : ""}`}><button className="route-card__select" type="button" aria-pressed={route.id === selected?.id} onClick={() => setSelectedId(route.id)}><span><strong>{routeLabel(route)}</strong><small>{seller(route)} · {formatRouteDate(route.date)}</small></span><span className={`route-badge route-badge--${isExpiredDraft(route) ? "warning" : tones[route.status]}`}>{isExpiredDraft(route) ? "Borrador vencido" : labels[route.status]}</span><span className="route-card__meta"><small>{route.points.length} puntos</small><small>Versión {route.version}</small><small>{isExpiredDraft(route) ? "Copia para reprogramar" : route.status === "DRAFT" || route.status === "PUBLISHED" ? "Orden revisable" : "Solo lectura"}</small></span></button><button className="route-card__more" type="button" aria-label={`Acciones de ${routeLabel(route)}`} aria-expanded={menuRoute?.id === route.id} onClick={(event) => { const opening = menuRoute?.id !== route.id; setMenuRoute(opening ? route : null); setMenuAnchor(opening ? event.currentTarget : null); }}><MoreVertical aria-hidden="true" /></button>{menuRoute?.id === route.id && <TableActionMenu anchor={menuAnchor} ariaLabel={`Acciones de ${routeLabel(route)}`} variant="golden" onDismiss={() => { setMenuRoute(null); setMenuAnchor(null); }} items={menuItems(route).map((item) => ({ ...item, onSelect: () => { setMenuRoute(null); setMenuAnchor(null); item.onSelect(); } }))} />}</article>)}</div><div className="route-rail__footer"><DataTablePagination page={page} totalPages={totalPages} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={() => undefined} ariaLabel="Paginación de rutas" summary={`${rangeStart}–${rangeEnd} de ${totalElements}`} variant="golden" density="compact" showPageSize={false} />{selected && <div className="route-rail__actions"><Button onClick={() => onDetail(selected)}>Ver detalle</Button>{canManage && (selected.status === "DRAFT" || selected.status === "PUBLISHED") && <Button variant="primary" onClick={() => onOrder(selected)}>Editar orden</Button>}</div>}</div></aside>
    </div>
  </section>;
}
