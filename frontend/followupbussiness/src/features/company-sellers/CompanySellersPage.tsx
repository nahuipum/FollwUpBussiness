import { ClipboardList, ContactRound, LayoutDashboard, Settings, UserRound, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigate } from "../../app/navigation";
import { getSessionCompanyLabel, getSessionIdentity, logout, subscribeToSession } from "../auth/auth";
import { PasswordRecoveryBrandMark } from "../auth/components/BrandPanel";
import { DashboardLayout } from "../../shared/layout/DashboardLayout";
import { SellerDetailDialog } from "./components/SellerDetailDialog";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { SellerFilters } from "./components/SellerFilters";
import { SellerTable } from "./components/SellerTable";
import { sellerSessionKey, useSellers } from "./hooks/useSellers";
import type { Seller } from "./types";
import "./styles/company-sellers.css";

export function CompanySellersPage() {
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const isSupervisor = getSessionIdentity()?.roles.includes("SUPERVISOR") ?? false;
  const sellers = useSellers();
  const items = sellers.result?.items ?? [];
  const [detail, setDetail] = useState<Seller | null>(null);
  const sessionKeyRef = useRef(sellers.sessionKey);

  useEffect(() => subscribeToSession(() => {
    const nextKey = sellerSessionKey();
    if (sessionKeyRef.current === nextKey) return;
    sessionKeyRef.current = nextKey;
    setDetail(null);
  }), []);

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel={companyName}
      navigationLabel={isSupervisor ? "Supervisor" : "Empresa"}
      profile={{ initials: sellers.displayName.slice(0, 2).toUpperCase(), name: sellers.displayName, role: isSupervisor ? "Supervisor" : "Equipo comercial", scopeLabel: companyName }}
      breadcrumbs={[companyName, "Vendedores"]}
      topbarContext={companyName}
      onLogout={() => { void logout(); navigate("/", { replace: true }); }}
      navigation={isSupervisor ? [
        { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, onSelect: () => navigate("/supervisor/dashboard") },
        { id: "sellers", label: "Vendedores", icon: <UserRound />, active: true },
      ] : [
        { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, onSelect: () => navigate("/company/dashboard") },
        { id: "administrators-supervisors", label: "Administradores y supervisores", icon: <Users />, onSelect: () => navigate("/company/administrators-supervisors") },
        { id: "sellers", label: "Vendedores", icon: <UserRound />, active: true },
        { id: "clients", label: "Clientes", icon: <ContactRound />, onSelect: () => navigate("/company/clients") },
        { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
        { id: "settings", label: "Configuración", icon: <Settings /> },
      ]}
    >
      <section className="seller-list" aria-labelledby="seller-list-title">
        <header className="seller-list__heading"><div><h1 id="seller-list-title">Vendedores</h1><p>Consulta y organiza el equipo comercial de la empresa.</p></div></header>
        <section className="seller-list__card" aria-label="Listado de vendedores">
          <SellerFilters query={sellers.search} status={sellers.status} supervisorId={sellers.supervisorId} territoryId={sellers.territoryId} supervisors={sellers.filterOptions.supervisors} territories={sellers.filterOptions.territories} onQueryChange={sellers.changeSearch} onStatusChange={sellers.changeStatus} onSupervisorChange={sellers.changeSupervisor} onTerritoryChange={sellers.changeTerritory} />
          {sellers.error && <div className="seller-list__state" role="alert"><h2>{sellers.error.status === 403 ? "No tienes permisos" : "Ocurrió un problema temporal"}</h2><p>{sellers.error.status === 403 ? "No tienes permiso para consultar vendedores." : "No pudimos mostrar los vendedores. Inténtalo más tarde."}</p><button className="seller-list__secondary" type="button" onClick={sellers.retry}>Reintentar</button></div>}
          {sellers.loading && items.length === 0 ? <TableLoadingIndicator label="Cargando vendedores" /> : !sellers.error && items.length === 0 ? <div className="seller-list__empty"><h2>{sellers.search || sellers.status || sellers.supervisorId || sellers.territoryId ? "No encontramos vendedores" : "Aún no hay vendedores"}</h2><p>{sellers.search || sellers.status || sellers.supervisorId || sellers.territoryId ? "Prueba con otros filtros o términos de búsqueda." : "Cuando existan vendedores aparecerán en este listado."}</p>{(sellers.search || sellers.status || sellers.supervisorId || sellers.territoryId) && <button className="seller-list__secondary" type="button" onClick={sellers.clearFilters}>Limpiar filtros</button>}</div> : !sellers.error && <><SellerTable sellers={items} page={sellers.page} totalPages={sellers.result?.page.totalPages ?? 0} totalElements={sellers.result?.page.totalElements ?? items.length} onPageChange={sellers.goToPage} onDetail={setDetail} />{sellers.loading && <div className="seller-list__stale"><TableLoadingIndicator label="Actualizando vendedores" compact /></div>}</>}
        </section>
        {detail && <SellerDetailDialog seller={detail} onClose={() => setDetail(null)} />}
      </section>
    </DashboardLayout>
  );
}
