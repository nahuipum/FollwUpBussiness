import { Eye, MoreVertical } from "lucide-react";
import { useRef, useState } from "react";
import { DataTable, DataTablePagination, DataTableStatus, type DataTableColumn } from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import { routeLabel } from "../route-label";
import type { Route, RouteStatus } from "../types";

const labels: Record<RouteStatus, string> = { DRAFT: "Borrador", PUBLISHED: "Publicada", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" };
const tones: Record<RouteStatus, "success" | "warning" | "danger"> = { DRAFT: "warning", PUBLISHED: "success", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "danger" };
export function RouteTable({ routes, sellers, page, pageSize, totalPages, totalElements, lastUpdated, onDetail, onPageChange, onPageSizeChange }: { routes: readonly Route[]; sellers: readonly Readonly<{ id: string; label: string }>[]; page: number; pageSize: DataTablePageSize; totalPages: number; totalElements: number; lastUpdated: Date | null; onDetail: (route: Route) => void; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: DataTablePageSize) => void }) {
  const [menuRoute, setMenuRoute] = useState<Route | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const columns: readonly DataTableColumn<Route>[] = [
    { id: "date", header: "Fecha", label: "Fecha", width: "16%", render: (route) => route.date },
    { id: "route", header: "Ruta", label: "Ruta", width: "25%", render: (route) => routeLabel(route) },
    { id: "seller", header: "Vendedor", label: "Vendedor", width: "23%", render: (route) => sellers.find((seller) => seller.id === route.sellerId)?.label ?? "Vendedor no disponible" },
    { id: "points", header: "Puntos", label: "Puntos", width: "12%", render: (route) => route.points.length },
    { id: "status", header: "Estado", label: "Estado", width: "15%", render: (route) => <DataTableStatus label={labels[route.status]} tone={tones[route.status]} /> },
    { id: "actions", header: "Acciones", label: "Acciones", width: "9%", align: "center", render: (route) => <div className="route-list__actions"><button ref={(node) => { triggers.current[route.id] = node; }} className="data-table__icon-button" type="button" aria-label={`Más acciones para ${routeLabel(route)}`} aria-expanded={menuRoute?.id === route.id} onClick={() => setMenuRoute(menuRoute?.id === route.id ? null : route)}><MoreVertical aria-hidden="true" /></button>{menuRoute?.id === route.id && <TableActionMenu anchor={triggers.current[route.id] ?? null} ariaLabel={`Acciones de ${routeLabel(route)}`} onDismiss={() => setMenuRoute(null)} items={[{ label: "Visualizar ruta", icon: <Eye aria-hidden="true" />, onSelect: () => { setMenuRoute(null); onDetail(route); } }]} />}</div> },
  ];
  return <><DataTable ariaLabel="Rutas" items={routes} rowKey={(route) => route.id} columns={columns} /><DataTablePagination page={page} pageSize={pageSize} totalPages={totalPages} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} ariaLabel="Paginación de rutas" summary={<>Mostrando {routes.length} de {totalElements} rutas</>} lastUpdated={lastUpdated} /></>;
}
