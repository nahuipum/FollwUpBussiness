import { Plus, Route as RouteIcon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Button } from "../../shared/ui/Button";
import { FormAlert } from "../../shared/ui/FormAlert";
import { WorkflowStepper } from "../../shared/ui/WorkflowStepper";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { getSessionIdentity } from "../auth/auth";
import { RouteDetailDialog } from "./components/RouteDetailDialog";
import { RoutePlanningWorkflow } from "./components/RoutePlanningWorkflow";
import { RouteFilters } from "./components/RouteFilters";
import { RouteOrderEditor } from "./components/RouteOrderEditor";
import { RoutePlanningModeDialog } from "./components/RoutePlanningModeDialog";
import { RouteProposalWorkflow } from "./components/RouteProposalWorkflow";
import { RoutePublishWorkflow } from "./components/RoutePublishWorkflow";
import { RouteWorkspace } from "./components/RouteWorkspace";
import { useRouteDetail } from "./hooks/useRouteDetail";
import { useRouteDraft } from "./hooks/useRouteDraft";
import { useRoutePublish } from "./hooks/useRoutePublish";
import { useRoutes } from "./hooks/useRoutes";
import { routeLabel } from "./route-label";
import "./styles/company-routes.css";

const unassignedLabels = { OUTSIDE_SHIFT: "Queda fuera del horario de jornada.", TIME_WINDOW_CONFLICT: "Su ventana horaria entra en conflicto.", UNREACHABLE: "No hay un recorrido vial disponible.", LIMIT_EXCEEDED: "Se alcanzó el límite contractual de visitas." } as const;
const formatDistance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })} km` : `${meters} m`;
const formatDuration = (seconds: number) => `${Math.floor(seconds / 3600) ? `${Math.floor(seconds / 3600)} h ` : ""}${Math.ceil((seconds % 3600) / 60)} min`;

function RouteWorkflowSuccess({ title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }: { title: string; message: string; primaryLabel: string; onPrimary: () => void; secondaryLabel?: string; onSecondary?: () => void }) {
  return <section className="route-page-workflow route-success-page" aria-labelledby="route-success-title"><div className="route-workflow-card"><span className="route-success-page__icon" aria-hidden="true">✓</span><span className="route-eyebrow">Rutas</span><h1 id="route-success-title">{title}</h1><p>{message}</p><div>{secondaryLabel && onSecondary && <Button onClick={onSecondary}>{secondaryLabel}</Button>}<Button variant="primary" onClick={onPrimary}>{primaryLabel}</Button></div></div></section>;
}

export function CompanyRoutesPage() {
  const [modeOpen, setModeOpen] = useState(false);
  const routes = useRoutes();
  const detail = useRouteDetail();
  const draft = useRouteDraft(routes.retry, routes.sellers);
  const items = routes.result?.items ?? [];
  const hasFilters = Boolean(routes.date || routes.sellerId || routes.status);
  const roles = getSessionIdentity()?.roles ?? [];
  const canManage = roles.includes("COMPANY_ADMIN") || roles.includes("SUPERVISOR");
  const publish = useRoutePublish(routes.sessionKey, (route) => { detail.replace(route); routes.retry(); }, () => { detail.retry(); routes.retry(); });
  const selectedRoute = detail.route ?? detail.target;
  const selectedSeller = selectedRoute ? routes.sellers.find((seller) => seller.id === selectedRoute.sellerId) : undefined;
  const selectMode = (mode: "manual" | "automatic") => { setModeOpen(false); draft.openForm(mode); };
  const proposalNames = new Map(draft.draft?.points.flatMap((point) => point.customerId ? [[point.customerId, point.customerName ?? "Cliente no disponible"] as const] : []) ?? []);
  const proposalAdjusted = draft.proposal !== null && draft.announcement.startsWith("Propuesta ajustada manualmente");
  const workflowActive = draft.view.kind !== "idle" || publish.route !== null || publish.published !== null;
  const detailIsCurrent = detail.target === null || items.some((route) => route.id === detail.target?.id);
  const routeIds = items.map((route) => route.id).join("|");
  useEffect(() => {
    if (!detail.target || workflowActive || routeIds.split("|").includes(detail.target.id)) return;
    const timeout = window.setTimeout(detail.close, 0);
    return () => window.clearTimeout(timeout);
  }, [detail.close, detail.target, routeIds, workflowActive]);
  return <section className="routes-page" aria-labelledby="route-list-title">
    <div hidden={workflowActive}>
    <header className="routes-page__heading"><div><span className="route-eyebrow">Planificación operativa</span><h1 id="route-list-title">Rutas</h1><p>Planifica, revisa y publica las rutas asignadas a los vendedores de la empresa.</p></div>{canManage && <Button variant="primary" onClick={() => setModeOpen(true)}><Plus aria-hidden="true" />Planificar ruta</Button>}</header>
    <section className="route-workspace-panel" aria-label="Consulta de rutas">
    <RouteFilters date={routes.date} sellerId={routes.sellerId} status={routes.status} sellers={routes.sellers} onDateChange={routes.changeDate} onSellerChange={routes.changeSeller} onStatusChange={routes.changeStatus} />
    {hasFilters && <div className="route-active-filters"><span>Filtros activos</span>{routes.date && <span className="route-chip">Fecha: {routes.date}</span>}{routes.sellerId && <span className="route-chip">Vendedor seleccionado</span>}{routes.status && <span className="route-chip">Estado: {routes.status}</span>}<Button variant="ghost" size="compact" onClick={routes.clearFilters}>Limpiar filtros</Button></div>}
    {routes.error && items.length > 0 && <InlineAlert variant="error" title="No pudimos actualizar las rutas" message="Mostramos la última información disponible. Reintenta sin perder los filtros actuales." action={{ label: "Reintentar", onClick: routes.retry }} {...(routes.error.correlationId ? { correlationId: routes.error.correlationId } : {})} />}
    {routes.forbidden ? <AsyncStateCard variant="golden" tone="error" title="No tienes permisos" description="No tienes permiso para consultar las rutas de esta empresa." actionLabel="Reintentar" onAction={routes.retry} /> : routes.loading && items.length === 0 ? <section className="route-loading-panel"><TableLoadingIndicator label="Cargando rutas y mapa" /></section> : !routes.error && items.length === 0 ? <AsyncStateCard variant="golden" icon={<RouteIcon />} title={hasFilters ? "No encontramos rutas" : "Aún no hay rutas"} description={hasFilters ? "Prueba con otra fecha, vendedor o estado." : "Planifica una ruta manualmente o genera una propuesta automática. Ninguna opción publicará por sí sola."} actionLabel={hasFilters ? "Limpiar filtros" : canManage ? "Planificar ruta" : undefined} onAction={hasFilters ? routes.clearFilters : canManage ? () => setModeOpen(true) : undefined} /> : items.length > 0 && <><RouteWorkspace routes={items} sellers={routes.sellers} page={routes.page} pageSize={routes.pageSize} totalPages={routes.result?.page.totalPages ?? 0} totalElements={routes.result?.page.totalElements ?? items.length} canManage={canManage} onDetail={detail.open} onOrder={draft.openOrder} onProposal={draft.openProposal} onPublish={publish.open} onPageChange={routes.goToPage} />{routes.loading && <div className="route-refreshing" role="status"><span />Actualizando sin ocultar la última información disponible.</div>}</>}
    </section>

    </div>
    {modeOpen && <RoutePlanningModeDialog onSelect={selectMode} onClose={() => setModeOpen(false)} />}
    {detail.target && selectedRoute && detailIsCurrent && !workflowActive && <RouteDetailDialog target={detail.target} route={detail.route} sellerLabel={selectedSeller?.label ?? "Vendedor no disponible"} sellerAvailable={selectedSeller?.status === "ACTIVE"} loading={detail.loading} error={detail.error} canManage={canManage} onEditOrder={draft.openOrder} onGenerateProposal={draft.openProposal} onPublish={(route) => { detail.close(); publish.open(route); }} onRetry={detail.retry} onClose={detail.close} />}
    {publish.route && <RoutePublishWorkflow route={publish.route} sellerLabel={routes.sellers.find((seller) => seller.id === publish.route?.sellerId)?.label ?? "Vendedor no disponible"} sellerAvailable={routes.sellers.some((seller) => seller.id === publish.route?.sellerId && seller.status === "ACTIVE")} notifySeller={publish.notifySeller} busy={publish.busy} error={publish.error} onNotifySeller={publish.setNotifySeller} onClose={publish.close} onEditOrder={() => { const route = publish.route; if (route) { publish.close(); draft.openOrder(route); } }} onConfirm={publish.submit} onReload={() => { publish.close(); detail.retry(); routes.retry(); }} />}
    {publish.published && <RouteWorkflowSuccess title="Ruta publicada" message={`${routeLabel(publish.published)} quedó publicada para el vendedor. La versión actual es ${publish.published.version}.`} primaryLabel="Volver a rutas" onPrimary={publish.closePublished} />}
    {draft.view.kind === "created" && draft.created && <RouteWorkflowSuccess title="Borrador guardado" message={`${routeLabel(draft.created)} se guardó como DRAFT. Puedes revisar el orden o publicar después mediante una acción separada.`} primaryLabel="Revisar orden" onPrimary={draft.openCreatedOrder} secondaryLabel="Volver a rutas" onSecondary={draft.closeCreated} />}
    {draft.view.kind === "order-saved" && draft.orderSaved && <RouteWorkflowSuccess title={draft.orderSaved.status === "PUBLISHED" ? "Orden actualizado" : "Orden guardado"} message={draft.orderSaved.status === "PUBLISHED" ? `La ruta conserva los mismos puntos, vendedor, fecha y estado. El vendedor será notificado con la versión ${draft.orderSaved.version}.` : `El orden quedó guardado y la ruta continúa en DRAFT, versión ${draft.orderSaved.version}.`} primaryLabel="Volver a rutas" onPrimary={draft.closeOrderSaved} />}
    {draft.view.kind === "planning" && <RoutePlanningWorkflow mode={draft.mode} sellers={routes.sellers} date={draft.date} sellerId={draft.sellerId} customers={draft.customers} selected={draft.selected} serviceDurations={draft.serviceDurations} hasInvalidDurations={draft.hasInvalidDurations} loadingCustomers={draft.loadingCustomers} moreCustomers={draft.moreCustomers} suggestionError={draft.suggestionError} saving={draft.saving} error={draft.error} conflict={draft.conflict} availabilityStart={draft.availabilityStart} availabilityEnd={draft.availabilityEnd} proposalVisits={draft.proposalVisits} proposalValidation={draft.proposalValidation} onDate={draft.setDate} onSeller={draft.setSellerId} onSelected={draft.setSelected} onServiceDuration={draft.setServiceDuration} onAvailabilityStart={draft.setAvailabilityStart} onAvailabilityEnd={draft.setAvailabilityEnd} onProposalVisit={draft.updateProposalVisit} onSubmit={draft.submit} onGenerateAutomatic={draft.generateAutomatic} onLoadMore={draft.loadMore} onRetrySuggestions={draft.retrySuggestions} onRetryCustomers={draft.retryCustomers} onClose={draft.close} onChangeMode={() => { draft.close(); setModeOpen(true); }} />}
    {draft.view.kind === "proposal" && draft.draft && <RouteProposalWorkflow route={draft.draft} availabilityStart={draft.availabilityStart} availabilityEnd={draft.availabilityEnd} visits={draft.proposalVisits} proposal={draft.proposal} validation={draft.proposalValidation} saving={draft.saving} error={draft.error} conflict={draft.conflict} onAvailabilityStart={draft.setAvailabilityStart} onAvailabilityEnd={draft.setAvailabilityEnd} onVisit={draft.updateProposalVisit} onOptimize={draft.optimize} onClose={draft.closeProposal} onChangeMode={() => { if (!draft.saving) { draft.close(); setModeOpen(true); } }} />}
    {draft.view.kind === "order" && draft.draft && <section className="route-page-workflow" aria-labelledby="route-order-title"><header className="routes-page__heading route-workflow-heading"><div><span className="route-eyebrow">Rutas · Orden</span><h1 id="route-order-title">{draft.proposal ? "Revisar propuesta automática" : draft.draft.status === "PUBLISHED" ? "Editar orden publicado" : "Editar orden del borrador"}</h1><p>El mapa es complementario; la secuencia textual conserva toda la operación.</p></div><Button onClick={draft.closeOrder} disabled={draft.saving}>Volver a rutas</Button></header><div className="route-order-workflow route-workflow-card"><p className="sr-only" role="status" aria-live="polite">{draft.announcement}</p>
      <WorkflowStepper label="Progreso de edición de orden" steps={draft.draft.status === "PUBLISHED" ? [{ label: "Ruta vigente", state: "complete" }, { label: "Nuevo orden", state: "current" }, { label: "Confirmar" }, { label: "Notificar" }] : draft.proposal ? [{ label: "Datos base", state: "complete" }, { label: "Clientes", state: "complete" }, { label: "Restricciones", state: "complete" }, { label: "Generar propuesta", state: "complete" }, { label: "Revisar y guardar", state: "current" }] : [{ label: "Datos base", state: "complete" }, { label: "Clientes", state: "complete" }, { label: "Orden y mapa", state: "current" }, { label: "Revisar y guardar" }]} />
      {draft.draft.status === "PUBLISHED" && <div className="route-inline-notice route-inline-notice--warning"><strong>La modificación notificará al vendedor</strong><p>Solo se enviará una permutación completa de los mismos puntos. Se conservan vendedor, fecha, territorio, estado y ejecución.</p></div>}
      {draft.proposal && <><div className={`route-info${proposalAdjusted ? " route-info--warning" : ""}`}><Sparkles aria-hidden="true" /><div><strong>{proposalAdjusted ? "Propuesta ajustada manualmente" : "Esto es una propuesta, todavía no un orden guardado"}</strong><p>{proposalAdjusted ? "Las estimaciones anteriores están pendientes de actualización y no representan el nuevo orden." : "Se muestra inicialmente en el orden producido por el optimizador. Puedes ajustarla; la ruta seguirá en DRAFT y no se publicará automáticamente."}</p></div></div><div className="route-proposal-summary"><div><span>Resultado</span><strong>{draft.proposal.optimality === "OPTIMAL" ? "Óptimo" : draft.proposal.optimality === "FEASIBLE" ? "Factible" : "Límite de tiempo"}</strong></div><div><span>Distancia</span><strong>{proposalAdjusted ? "Pendiente" : formatDistance(draft.proposal.totalDistanceMeters)}</strong></div><div><span>Traslado</span><strong>{proposalAdjusted ? "Pendiente" : formatDuration(draft.proposal.totalTravelSeconds)}</strong></div><div><span>Atención</span><strong>{formatDuration(draft.proposal.totalServiceSeconds)}</strong></div></div>{draft.proposal.unassignedVisits.length > 0 && <section className="route-unassigned"><h3>Visitas no asignadas</h3><ul>{draft.proposal.unassignedVisits.map((visit) => <li key={visit.customerId}><strong>{proposalNames.get(visit.customerId) ?? "Visita no disponible"}</strong><span>{unassignedLabels[visit.reason]}</span></li>)}</ul></section>}</>}
      {draft.conflict && <FormAlert><strong>La ruta cambió mientras editabas</strong><p>{draft.announcement || "Conservamos tu intención local cuando los puntos coinciden. Revisa la versión vigente y confirma nuevamente."}</p></FormAlert>}{draft.error && <FormAlert><strong>{draft.locked ? "La ruta ya no admite cambios" : "No pudimos guardar el orden"}</strong><p>{draft.locked ? "La jornada o el estado vigente bloquean la edición. La ruta se muestra en modo lectura." : "No se aplicaron cambios. Revisa la información e inténtalo nuevamente."}</p></FormAlert>}
      {draft.locked ? <div className="route-locked"><RouteIcon aria-hidden="true" /><h3>Ruta de solo lectura</h3><p>{draft.announcement}</p></div> : <RouteOrderEditor route={draft.draft} saving={draft.saving} onMove={draft.move} onMoveTo={draft.moveTo} context={draft.proposal ? "proposal" : draft.draft.status === "PUBLISHED" ? "published" : "draft"} title={draft.proposal ? "Orden propuesto editable" : "Secuencia actual"} />}
      <footer className="route-planning__footer"><span>{draft.proposal || draft.announcement ? "Cambios sin guardar hasta confirmar" : ""}</span><div><Button onClick={draft.closeOrder} disabled={draft.saving}>Cerrar</Button>{draft.draft.status === "DRAFT" && <Button onClick={draft.openProposalFromOrder} disabled={draft.saving}>{draft.proposal ? "Volver a restricciones" : "Generar propuesta"}</Button>}<Button variant="primary" onClick={draft.saveOrder} disabled={draft.saving || draft.locked}>{draft.saving ? "Guardando…" : draft.draft.status === "PUBLISHED" ? "Guardar orden y notificar" : "Guardar orden"}</Button></div></footer>
    </div></section>}
  </section>;
}
