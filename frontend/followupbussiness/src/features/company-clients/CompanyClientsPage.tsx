import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Plus } from "lucide-react";
import { getSessionIdentity } from "../auth/auth";
import { ClientFormDialog } from "./components/ClientFormDialog";
import { useClientForm } from "./hooks/useClientForm";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
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
  const canManage = getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;
  const form = useClientForm(clients.retry);
  const actions = useClientActions(clients.retry);
  const items = clients.result?.items ?? [];
  const hasFilters = Boolean(clients.search || clients.status || clients.territoryId || clients.sellerId || clients.withoutVisitSince || clients.withoutPurchaseSince);

  return (
    <section className="client-list" aria-labelledby="client-list-title">
      <header className="client-list__heading">
        <div>
          <h1 id="client-list-title">Clientes</h1>
          <p>Consulta y organiza la cartera de clientes de la empresa.</p>
        </div>
        {canManage && <button className="client-list__primary" type="button" onClick={() => form.open(null)}><Plus aria-hidden="true" />Crear cliente</button>}
      </header>
      <section className="client-list__card" aria-label="Listado de clientes">
        <ClientFilters
          query={clients.search} status={clients.status} territoryId={clients.territoryId} sellerId={clients.sellerId}
          withoutVisitSince={clients.withoutVisitSince} withoutPurchaseSince={clients.withoutPurchaseSince}
          options={clients.options} onQueryChange={clients.changeSearch} onStatusChange={clients.changeStatus}
          onTerritoryChange={clients.changeTerritory} onSellerChange={clients.changeSeller}
          onWithoutVisitSinceChange={clients.changeWithoutVisitSince} onWithoutPurchaseSinceChange={clients.changeWithoutPurchaseSince}
        />
        {clients.error && <InlineAlert variant="error" title={clients.error.status === 403 ? "No tienes permisos" : "Ocurrió un problema temporal"} message={clients.error.status === 403 ? "No tienes permiso para consultar clientes." : "No pudimos actualizar los clientes. Los datos mostrados pueden no estar vigentes."} action={{ label: "Reintentar", onClick: clients.retry }} {...(clients.error.correlationId ? { correlationId: clients.error.correlationId } : {})} />}
        {clients.forbidden ? <AsyncStateCard tone="error" title="No tienes permisos" description="No tienes permiso para consultar clientes." actionLabel="Reintentar" onAction={clients.retry} />
          : clients.loading && items.length === 0 ? <TableLoadingIndicator label="Cargando clientes" />
          : !clients.error && items.length === 0 ? <AsyncStateCard title={hasFilters ? "No encontramos clientes" : "Aún no hay clientes"} description={hasFilters ? "Prueba con otros filtros o términos de búsqueda." : "Cuando existan clientes aparecerán en este listado."} {...(hasFilters ? { actionLabel: "Limpiar filtros", onAction: clients.clearFilters } : {})} />
          : items.length > 0 && <><ClientTable clients={items} page={clients.page} pageSize={clients.pageSize} totalPages={clients.result?.page.totalPages ?? 0} totalElements={clients.result?.page.totalElements ?? items.length} lastUpdated={clients.lastUpdated} canManage={canManage} onDetail={actions.openDetail} onEdit={form.open} onChangeStatus={actions.openStatus} onPageChange={clients.goToPage} onPageSizeChange={clients.changePageSize} />{clients.loading && <div className="client-list__stale"><TableLoadingIndicator label="Actualizando clientes; los datos mostrados pueden no estar vigentes" compact /></div>}</>}
      </section>
      {form.client !== undefined && <ClientFormDialog client={form.client} territories={form.territories} loading={form.loading} busy={form.busy} error={form.error} duplicates={form.duplicates} onClose={form.close} onRetry={form.retry} onSubmit={form.submit} onDuplicateCheck={form.duplicateCheck} onDismissError={form.dismissError} onDismissDuplicates={form.dismissDuplicates} />}
      {actions.detailTarget && <ClientDetailDialog target={actions.detailTarget} client={actions.detail} loading={actions.detailLoading} error={actions.detailError} territoryLabel={actions.detail?.territoryId ? clients.options.territories.find((territory) => territory.id === actions.detail?.territoryId)?.label ?? "Territorio no disponible" : "Sin asignar"} onRetry={actions.retryDetail} onClose={actions.closeDetail} />}
      {canManage && actions.statusTarget && <ClientStatusDialog client={actions.statusTarget} busy={actions.statusBusy} error={actions.statusError} onClose={actions.closeStatus} onConfirm={actions.submitStatus} />}
      {form.notice && <OperationDialog titleId="client-operation-title" tone="success" title={form.notice.title} message={form.notice.message} onClose={form.closeNotice} />}
    </section>
  );
}
