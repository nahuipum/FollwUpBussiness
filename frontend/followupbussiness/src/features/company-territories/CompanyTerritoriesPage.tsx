import { Plus, Shield } from "lucide-react";
import { navigate } from "../../app/navigation";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Button } from "../../shared/ui/Button";
import { DataTablePanel, DataTableResultsHeader } from "../../shared/ui/DataTableWorkspace";
import { ReadOnlyNotice } from "../../shared/ui/ReadOnlyNotice";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { getSessionIdentity } from "../auth/auth";
import { TerritoryFilters } from "./components/TerritoryFilters";
import { TerritoryFormDialog } from "./components/TerritoryFormDialog";
import { TerritoryTable } from "./components/TerritoryTable";
import { useTerritoryForm } from "./hooks/useTerritoryForm";
import { useTerritories } from "./hooks/useTerritories";
import "./styles/company-territories.css";

export function CompanyTerritoriesPage() {
  const canManage = getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;
  const territories = useTerritories();
  const form = useTerritoryForm(territories.retry);
  const items = territories.result?.items ?? [];
  const filtered = Boolean(territories.search || territories.status);
  const error = territories.error;

  const header = <header className="territory-list__heading">
    <div><span className="territory-list__eyebrow">Organización comercial</span><h1 id="territory-list-title">Zonas</h1><p>Consulta y organiza las zonas comerciales disponibles para el equipo de ventas.</p></div>
    {canManage && error?.status !== 403 && <Button variant="primary" className="territory-list__create" leadingIcon={<Plus aria-hidden="true" />} onClick={() => form.open(null)}>Crear zona</Button>}
  </header>;

  if (error?.status === 403) return <section className="territory-list" aria-labelledby="territory-list-title">
    {header}
    <AsyncStateCard variant="golden" tone="error" icon={<Shield />} title="No tienes permisos" description="No tienes permiso para consultar las zonas de esta empresa." correlationId={error.correlationId} actionLabel="Volver al resumen" onAction={() => navigate("/company/dashboard")} />
  </section>;

  return <section className="territory-list" aria-labelledby="territory-list-title">
    {header}
    <DataTablePanel ariaLabel="Listado de zonas">
      <TerritoryFilters search={territories.search} status={territories.status} onSearchChange={territories.changeSearch} onStatusChange={territories.changeStatus} />
      {!canManage && <ReadOnlyNotice variant="golden" />}
      {error && items.length === 0 ? <AsyncStateCard variant="golden" tone="error" title="Ocurrió un problema temporal" description="No pudimos mostrar las zonas. Inténtalo más tarde." correlationId={error.correlationId} actionLabel="Reintentar" onAction={territories.retry} /> : territories.loading && items.length === 0 ? <><DataTableResultsHeader description="Cargando zonas" /><TableLoadingIndicator variant="golden" columns={canManage ? 6 : 5} label="Cargando zonas" /></> : items.length === 0 ? <AsyncStateCard variant="golden" title={filtered ? "No encontramos zonas" : "Aún no hay zonas"} description={filtered ? "Cambia la búsqueda o ajusta el filtro de estado para ver otros resultados." : "Crea la primera zona para comenzar a organizar las asignaciones comerciales."} {...(filtered ? { actionLabel: "Limpiar filtros", onAction: territories.clearFilters } : canManage ? { actionLabel: "Crear zona", actionIcon: <Plus aria-hidden="true" />, onAction: () => form.open(null) } : {})} /> : <>
        {error && <InlineAlert variant="error" className="territory-list__stale-error" title="Ocurrió un problema temporal" message="No pudimos actualizar las zonas. Mostramos la última versión disponible." {...(error.correlationId ? { correlationId: error.correlationId } : {})} action={{ label: "Reintentar", onClick: territories.retry }} />}
        <TerritoryTable territories={items} page={territories.result?.page.page ?? territories.page} pageSize={territories.pageSize} totalPages={territories.result?.page.totalPages ?? 0} totalElements={territories.result?.page.totalElements ?? items.length} lastUpdated={territories.lastUpdated} canManage={canManage} loading={territories.loading} error={error} onPageChange={territories.goToPage} onPageSizeChange={territories.changePageSize} onEdit={form.open} />
      </>}
    </DataTablePanel>
    {canManage && form.territory !== undefined && <TerritoryFormDialog territory={form.territory} busy={form.busy} error={form.error} conflict={form.conflict} onClose={form.close} onReload={form.reloadAfterConflict} onSubmit={form.submit} />}
  </section>;
}
