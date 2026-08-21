import { Plus, Search } from "lucide-react";
import { getSessionIdentity } from "../auth/auth";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { ReadOnlyNotice } from "../../shared/ui/ReadOnlyNotice";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { VisualSelect } from "../../shared/ui/VisualSelect";
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
  return <section className="territory-list" aria-labelledby="territory-list-title">
    <header className="territory-list__heading"><div><h1 id="territory-list-title">Zonas</h1><p>Consulta y organiza las zonas comerciales disponibles para el equipo de ventas.</p></div>{canManage && <button className="territory-list__primary" type="button" onClick={() => form.open(null)}><Plus aria-hidden="true" />Crear zona</button>}</header>
    <section className="territory-list__card" aria-label="Listado de zonas">
      <div className="territory-list__toolbar"><label className="territory-list__search"><Search aria-hidden="true" /><span className="sr-only">Buscar zonas</span><input value={territories.search} onChange={(event) => territories.changeSearch(event.target.value)} placeholder="Buscar por nombre o código" /></label><div className="filter-field"><span>Estado</span><VisualSelect ariaLabel="Estado" value={territories.status ?? "ALL"} options={[{ value: "ALL", label: "Todos" }, { value: "ACTIVE", label: "Activas" }, { value: "INACTIVE", label: "Inactivas" }]} onChange={(value) => territories.changeStatus(value === "ALL" ? null : value)} /></div></div>
      {!canManage && <ReadOnlyNotice />}
      {territories.error ? <AsyncStateCard tone="error" title={territories.error.status === 403 ? "No tienes permisos" : "Ocurrió un problema temporal"} description={territories.error.status === 403 ? "No tienes permiso para consultar zonas." : "No pudimos mostrar las zonas. Inténtalo más tarde."} actionLabel="Reintentar" onAction={territories.retry} /> : territories.loading && items.length === 0 ? <TableLoadingIndicator label="Cargando zonas" /> : items.length === 0 ? <AsyncStateCard title={filtered ? "No encontramos zonas" : "Aún no hay zonas"} description={filtered ? "Prueba con otros filtros o términos de búsqueda." : "Cuando existan zonas aparecerán en este listado."} {...(filtered ? { actionLabel: "Limpiar filtros", onAction: territories.clearFilters } : {})} /> : <><TerritoryTable territories={items} page={territories.page} pageSize={territories.pageSize} totalPages={territories.result?.page.totalPages ?? 0} totalElements={territories.result?.page.totalElements ?? items.length} lastUpdated={territories.lastUpdated} canManage={canManage} onPageChange={territories.goToPage} onPageSizeChange={territories.changePageSize} onEdit={form.open} />{territories.loading && <div className="territory-list__stale"><TableLoadingIndicator label="Actualizando zonas" compact /></div>}</>}
    </section>
    {canManage && form.territory !== undefined && <TerritoryFormDialog territory={form.territory} busy={form.busy} error={form.error} conflict={form.conflict} onClose={form.close} onReload={form.reloadAfterConflict} onSubmit={form.submit} />}
  </section>;
}
