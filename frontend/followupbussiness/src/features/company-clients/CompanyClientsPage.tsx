import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { ClientFilters } from "./components/ClientFilters";
import { ClientTable } from "./components/ClientTable";
import { useClients } from "./hooks/useClients";
import "./styles/company-clients.css";

export function CompanyClientsPage() {
  const clients = useClients();
  const items = clients.result?.items ?? [];
  const hasFilters = Boolean(clients.search || clients.status || clients.territoryId || clients.sellerId || clients.withoutVisitSince || clients.withoutPurchaseSince);

  return (
    <section className="client-list" aria-labelledby="client-list-title">
      <header className="client-list__heading">
        <div>
          <h1 id="client-list-title">Clientes</h1>
          <p>Consulta y organiza la cartera de clientes de la empresa.</p>
        </div>
      </header>
      <section className="client-list__card" aria-label="Listado de clientes">
        <ClientFilters
          query={clients.search} status={clients.status} territoryId={clients.territoryId} sellerId={clients.sellerId}
          withoutVisitSince={clients.withoutVisitSince} withoutPurchaseSince={clients.withoutPurchaseSince}
          options={clients.options} onQueryChange={clients.changeSearch} onStatusChange={clients.changeStatus}
          onTerritoryChange={clients.changeTerritory} onSellerChange={clients.changeSeller}
          onWithoutVisitSinceChange={clients.changeWithoutVisitSince} onWithoutPurchaseSinceChange={clients.changeWithoutPurchaseSince}
        />
        {clients.lastUpdated && <p className="client-list__updated" role="status">Última actualización: {clients.lastUpdated.toLocaleTimeString()}</p>}
        {clients.error && <InlineAlert variant="error" title={clients.error.status === 403 ? "No tienes permisos" : "Ocurrió un problema temporal"} message={clients.error.status === 403 ? "No tienes permiso para consultar clientes." : "No pudimos actualizar los clientes. Los datos mostrados pueden no estar vigentes."} action={{ label: "Reintentar", onClick: clients.retry }} {...(clients.error.correlationId ? { correlationId: clients.error.correlationId } : {})} />}
        {clients.forbidden ? <AsyncStateCard tone="error" title="No tienes permisos" description="No tienes permiso para consultar clientes." actionLabel="Reintentar" onAction={clients.retry} />
          : clients.loading && items.length === 0 ? <TableLoadingIndicator label="Cargando clientes" />
          : !clients.error && items.length === 0 ? <AsyncStateCard title={hasFilters ? "No encontramos clientes" : "Aún no hay clientes"} description={hasFilters ? "Prueba con otros filtros o términos de búsqueda." : "Cuando existan clientes aparecerán en este listado."} {...(hasFilters ? { actionLabel: "Limpiar filtros", onAction: clients.clearFilters } : {})} />
          : items.length > 0 && <><ClientTable clients={items} page={clients.page} pageSize={clients.pageSize} totalPages={clients.result?.page.totalPages ?? 0} totalElements={clients.result?.page.totalElements ?? items.length} onPageChange={clients.goToPage} onPageSizeChange={clients.changePageSize} />{clients.loading && <div className="client-list__stale"><TableLoadingIndicator label="Actualizando clientes; los datos mostrados pueden no estar vigentes" compact /></div>}</>}
      </section>
    </section>
  );
}
