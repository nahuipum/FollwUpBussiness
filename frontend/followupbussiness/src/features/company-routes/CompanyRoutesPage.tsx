import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Plus } from "lucide-react";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { RouteDetailDialog } from "./components/RouteDetailDialog";
import { RouteFilters } from "./components/RouteFilters";
import { RouteTable } from "./components/RouteTable";
import { RouteDraftDialog } from "./components/RouteDraftDialog";
import { getSessionIdentity } from "../auth/auth";
import { useRouteDetail } from "./hooks/useRouteDetail";
import { useRouteDraft } from "./hooks/useRouteDraft";
import { useRoutes } from "./hooks/useRoutes";
import "./styles/company-routes.css";

export function CompanyRoutesPage() {
  const routes = useRoutes(); const detail = useRouteDetail(); const draft = useRouteDraft(routes.retry); const items = routes.result?.items ?? []; const hasFilters = Boolean(routes.date || routes.sellerId || routes.status); const roles = getSessionIdentity()?.roles ?? []; const canCreate = roles.includes("COMPANY_ADMIN") || roles.includes("SUPERVISOR");
  const selectedRoute = detail.route ?? detail.target;
  return <section className="route-list" aria-labelledby="route-list-title"><header className="route-list__heading"><div><h1 id="route-list-title">Rutas</h1><p>Consulta las rutas asignadas a los vendedores de la empresa.</p></div>{canCreate && <button className="route-list__primary" type="button" onClick={draft.openForm}><Plus aria-hidden="true" />Crear borrador</button>}</header><section className="route-list__card" aria-label="Listado de rutas"><RouteFilters date={routes.date} sellerId={routes.sellerId} status={routes.status} sellers={routes.sellers} onDateChange={routes.changeDate} onSellerChange={routes.changeSeller} onStatusChange={routes.changeStatus} />
    {routes.error && <InlineAlert variant="error" title={routes.error.status === 403 ? "No tienes permisos" : "Ocurrió un problema temporal"} message={routes.error.status === 403 ? "No tienes permiso para consultar rutas." : "No pudimos actualizar las rutas. Los datos mostrados pueden no estar vigentes."} action={{ label: "Reintentar", onClick: routes.retry }} {...(routes.error.correlationId ? { correlationId: routes.error.correlationId } : {})} />}
    {routes.forbidden ? <AsyncStateCard tone="error" title="No tienes permisos" description="No tienes permiso para consultar rutas." actionLabel="Reintentar" onAction={routes.retry} /> : routes.loading && items.length === 0 ? <TableLoadingIndicator label="Cargando rutas" /> : !routes.error && items.length === 0 ? <AsyncStateCard title={hasFilters ? "No encontramos rutas" : "Aún no hay rutas"} description={hasFilters ? "Prueba con otros filtros." : "Cuando existan rutas aparecerán en este listado."} {...(hasFilters ? { actionLabel: "Limpiar filtros", onAction: routes.clearFilters } : {})} /> : items.length > 0 && <><RouteTable routes={items} sellers={routes.sellers} page={routes.page} pageSize={routes.pageSize} totalPages={routes.result?.page.totalPages ?? 0} totalElements={routes.result?.page.totalElements ?? items.length} lastUpdated={routes.lastUpdated} onDetail={detail.open} onPageChange={routes.goToPage} onPageSizeChange={routes.changePageSize} />{routes.loading && <div className="route-list__stale"><TableLoadingIndicator label="Actualizando rutas; los datos mostrados pueden no estar vigentes" compact /></div>}</>}</section>
    {detail.target && selectedRoute && <RouteDetailDialog target={detail.target} route={detail.route} sellerLabel={routes.sellers.find((seller) => seller.id === selectedRoute.sellerId)?.label ?? "Vendedor no disponible"} loading={detail.loading} error={detail.error} onRetry={detail.retry} onClose={detail.close} />}
    {draft.open && <RouteDraftDialog sellers={routes.sellers} date={draft.date} sellerId={draft.sellerId} customers={draft.customers} selected={draft.selected} loadingCustomers={draft.loadingCustomers} moreCustomers={draft.moreCustomers} suggestionError={draft.suggestionError} saving={draft.saving} draft={draft.draft} error={draft.error} conflict={draft.conflict} announcement={draft.announcement} onDate={draft.setDate} onSeller={draft.setSellerId} onSelected={draft.setSelected} onSubmit={draft.submit} onMove={draft.move} onMoveTo={draft.moveTo} onSaveOrder={draft.saveOrder} onLoadMore={draft.loadMore} onRetrySuggestions={draft.retrySuggestions} onRetryCustomers={draft.retryCustomers} onClose={draft.close} />}
  </section>;
}
