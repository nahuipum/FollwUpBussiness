import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Plus } from "lucide-react";
import { getSessionIdentity } from "../auth/auth";
import { ClientFormDialog } from "./components/ClientFormDialog";
import { useClientForm } from "./hooks/useClientForm";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { DataTablePanel, DataTableResultsHeader } from "../../shared/ui/DataTableWorkspace";
import { ReadOnlyNotice } from "../../shared/ui/ReadOnlyNotice";
import { OperationDialog } from "../../shared/ui/OperationDialog";
import { ClientFilters } from "./components/ClientFilters";
import { ClientTable } from "./components/ClientTable";
import { useClients } from "./hooks/useClients";
import { useClientActions } from "./hooks/useClientActions";
import { ClientDetailDialog } from "./components/ClientDetailDialog";
import { ClientStatusDialog } from "./components/ClientStatusDialog";
import "./styles/company-clients.css";

export function CompanyClientsPage() {
  const clients = useClients();
  const canManage =
    getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;
  const form = useClientForm(clients.retry);
  const actions = useClientActions(clients.retry);
  const items = clients.result?.items ?? [];
  const hasFilters = Boolean(
    clients.search ||
    clients.status ||
    clients.territoryId ||
    clients.sellerId ||
    clients.withoutVisitSince ||
    clients.withoutPurchaseSince,
  );
  const territoryFilterLabel = clients.options.territories.find(
    (territory) => territory.id === clients.territoryId,
  )?.label;
  const sellerFilterLabel = clients.options.sellers.find(
    (seller) => seller.id === clients.sellerId,
  )?.label;

  return (
    <section className="client-list" aria-labelledby="client-list-title">
      <header className="client-list__heading">
        <div>
          <span className="client-list__eyebrow">Cartera comercial</span>
          <h1 id="client-list-title">Clientes</h1>
          <p>Consulta y organiza la cartera de clientes de la empresa.</p>
        </div>
        {canManage && (
          <button
            className="client-list__primary"
            type="button"
            onClick={() => form.open(null)}
          >
            <Plus aria-hidden="true" />
            Crear cliente
          </button>
        )}
      </header>
      <DataTablePanel ariaLabel="Listado de clientes">
        <ClientFilters
          variant="golden"
          query={clients.search}
          status={clients.status}
          territoryId={clients.territoryId}
          sellerId={clients.sellerId}
          withoutVisitSince={clients.withoutVisitSince}
          withoutPurchaseSince={clients.withoutPurchaseSince}
          options={clients.options}
          onQueryChange={clients.changeSearch}
          onStatusChange={clients.changeStatus}
          onTerritoryChange={clients.changeTerritory}
          onSellerChange={clients.changeSeller}
          onWithoutVisitSinceChange={clients.changeWithoutVisitSince}
          onWithoutPurchaseSinceChange={clients.changeWithoutPurchaseSince}
        />
        {!canManage && (
          <ReadOnlyNotice
            variant="golden"
            title="Consulta de solo lectura"
            description="Como supervisor puedes consultar los clientes de las carteras vigentes de tus vendedores, aplicar filtros y cambiar de página. La administración corresponde a un administrador."
          />
        )}
        {hasFilters && (
          <div className="client-list__active-filters" aria-label="Filtros activos">
            <span>Filtros activos:</span>
            {clients.territoryId && <span className="client-list__filter-chip">Zona: {territoryFilterLabel ?? clients.territoryId}</span>}
            {clients.sellerId && <span className="client-list__filter-chip">Vendedor: {sellerFilterLabel ?? clients.sellerId}</span>}
            {clients.status && <span className="client-list__filter-chip">Estado: {clients.status === "ACTIVE" ? "Activo" : "Inactivo"}</span>}
            {clients.withoutVisitSince && <span className="client-list__filter-chip">Sin visita: {clients.withoutVisitSince}</span>}
            {clients.withoutPurchaseSince && <span className="client-list__filter-chip">Sin compra: {clients.withoutPurchaseSince}</span>}
            {clients.search && <span className="client-list__filter-chip">Búsqueda: {clients.search}</span>}
            <button type="button" onClick={clients.clearFilters}>Limpiar filtros</button>
          </div>
        )}
        {clients.forbidden ? (
          <AsyncStateCard
            variant="golden"
            tone="error"
            title="No tienes permisos"
            description="No tienes permiso para consultar clientes."
            actionLabel="Reintentar"
            onAction={clients.retry}
          />
        ) : clients.error && items.length === 0 ? (
          <AsyncStateCard
            variant="golden"
            tone="error"
            title="Ocurrió un problema temporal"
            description="No pudimos mostrar los clientes. Inténtalo nuevamente."
            actionLabel="Reintentar"
            onAction={clients.retry}
            correlationId={clients.error.correlationId}
          />
        ) : clients.loading && items.length === 0 ? (
          <>
            <DataTableResultsHeader description="Cargando clientes" />
            <TableLoadingIndicator variant="golden" columns={5} label="Cargando clientes" />
          </>
        ) : !clients.error && items.length === 0 ? (
          <AsyncStateCard
            variant="golden"
            title={
              hasFilters ? "No encontramos clientes" : "Aún no hay clientes"
            }
            description={
              hasFilters
                ? "Prueba con otros filtros o términos de búsqueda."
                : "Cuando existan clientes aparecerán en este listado."
            }
            {...(hasFilters
              ? {
                  actionLabel: "Limpiar filtros",
                  onAction: clients.clearFilters,
                }
              : {})}
          />
        ) : (
          items.length > 0 && (
            <>
              {clients.error && (
                <InlineAlert
                  className="client-list__stale-error"
                  variant="error"
                  title="Ocurrió un problema temporal"
                  message="No pudimos actualizar los clientes. Mostramos la última versión disponible, que puede no estar vigente."
                  action={{ label: "Reintentar", onClick: clients.retry }}
                  {...(clients.error.correlationId ? { correlationId: clients.error.correlationId } : {})}
                />
              )}
              <DataTableResultsHeader
                description={`${clients.result?.page.totalElements ?? items.length} clientes`}
                status={clients.loading ? <div className="client-list__updating"><TableLoadingIndicator label="Actualizando resultados" compact /><span>Actualizando resultados</span></div> : undefined}
              />
              <ClientTable
                clients={items}
                page={clients.page}
                pageSize={clients.pageSize}
                totalPages={clients.result?.page.totalPages ?? 0}
                totalElements={
                  clients.result?.page.totalElements ?? items.length
                }
                lastUpdated={clients.lastUpdated}
                canManage={canManage}
                onDetail={actions.openDetail}
                onEdit={form.open}
                onChangeStatus={actions.openStatus}
                onPageChange={clients.goToPage}
                onPageSizeChange={clients.changePageSize}
              />
            </>
          )
        )}
      </DataTablePanel>
      {form.client !== undefined && (
        <ClientFormDialog
          key={`${form.client?.id ?? "create"}:${form.loading ? "loading" : form.client?.version ?? "ready"}`}
          client={form.client}
          territories={form.territories}
          loading={form.loading}
          busy={form.busy}
          error={form.error}
          duplicates={form.duplicates}
          onClose={form.close}
          onRetry={form.retry}
          onSubmit={form.submit}
          onDuplicateCheck={form.duplicateCheck}
          onDismissError={form.dismissError}
          onDismissDuplicates={form.dismissDuplicates}
        />
      )}
      {actions.detailTarget && (
        <ClientDetailDialog
          target={actions.detailTarget}
          client={actions.detail}
          loading={actions.detailLoading}
          error={actions.detailError}
          territoryLabel={
            actions.detail?.territoryId
              ? (clients.options.territories.find(
                  (territory) => territory.id === actions.detail?.territoryId,
                )?.label ?? "Territorio no disponible")
              : "Sin asignar"
          }
          onRetry={actions.retryDetail}
          onClose={actions.closeDetail}
        />
      )}
      {canManage && actions.statusTarget && (
        <ClientStatusDialog
          client={actions.statusTarget}
          busy={actions.statusBusy}
          error={actions.statusError}
          onClose={actions.closeStatus}
          onConfirm={actions.submitStatus}
        />
      )}
      {form.notice && (
        <OperationDialog
          appearance="golden"
          module="Clientes"
          titleId="client-operation-title"
          tone="success"
          title={form.notice.title}
          message={form.notice.message}
          onClose={form.closeNotice}
        />
      )}
    </section>
  );
}
