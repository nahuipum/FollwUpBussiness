import { ClipboardList, ContactRound, LayoutDashboard, ListFilter, Map, MapPinned, Settings, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardLayout, type DashboardNavigationItem } from "../../shared/layout/DashboardLayout";
import { getSessionCompanyLabel, getSessionIdentity, logout } from "../../features/auth/auth";
import { PasswordRecoveryBrandMark } from "../../features/auth/components/BrandPanel";
import { navigate } from "../navigation";

export type CompanySection = "dashboard" | "administrators-supervisors" | "sellers" | "territories" | "clients" | "customer-assignments" | "settings";
export type SupervisorSection = "dashboard" | "sellers" | "territories" | "clients" | "settings";
export type SellerSection = "settings";

type Props = {
  activeSection: CompanySection | SupervisorSection | SellerSection;
  workspace: "company" | "supervisor" | "seller";
  children: ReactNode;
};

const companySections: Record<CompanySection, string> = {
  dashboard: "Resumen",
  "administrators-supervisors": "Administradores y supervisores",
  sellers: "Vendedores",
  territories: "Zonas",
  clients: "Clientes",
  "customer-assignments": "Asignar cartera",
  settings: "Configuración",
};

const supervisorSections: Record<SupervisorSection, string> = {
  dashboard: "Resumen",
  sellers: "Vendedores",
  territories: "Zonas",
  clients: "Clientes",
  settings: "Configuración",
};

export function CompanyWorkspaceLayout({ activeSection, workspace, children }: Props) {
  const identity = getSessionIdentity();
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const isSupervisor = workspace === "supervisor"; const isSeller = workspace === "seller";
  const navigation = isSeller ? [item("settings", "Configuración", <Settings />, activeSection, "/seller/settings")] : isSupervisor
    ? supervisorNavigation(activeSection as SupervisorSection)
    : companyNavigation(activeSection as CompanySection, identity?.roles.includes("COMPANY_ADMIN") ?? false);

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel={companyName}
      navigationLabel={isSeller ? "Vendedor" : isSupervisor ? "Supervisor" : "Empresa"}
      profile={{
        initials: (identity?.displayName ?? "").slice(0, 2).toUpperCase(),
        name: identity?.displayName ?? "",
        role: isSeller ? "Vendedor" : isSupervisor ? "Supervisor" : "Administradora de empresa",
        scopeLabel: companyName,
      }}
      breadcrumbs={[companyName, isSeller ? "Configuración" : isSupervisor ? supervisorSections[activeSection as SupervisorSection] : companySections[activeSection as CompanySection]]}
      topbarContext={companyName}
      onLogout={() => { void logout(); navigate("/", { replace: true }); }}
      navigation={navigation}
    >
      {children}
    </DashboardLayout>
  );
}

function companyNavigation(activeSection: CompanySection, canManage: boolean): DashboardNavigationItem[] {
  return [
    item("dashboard", "Resumen", <LayoutDashboard />, activeSection, "/company/dashboard"),
    item("administrators-supervisors", "Administradores y supervisores", <Users />, activeSection, "/company/administrators-supervisors"),
    item("sellers", "Vendedores", <UserRound />, activeSection, "/company/sellers"),
    ...(canManage ? [item("territories", "Zonas", <MapPinned />, activeSection, "/company/territories")] : []),
    clientGroup(activeSection, "/company/clients", "/company/clients/map", canManage),
    ...(canManage ? [item("customer-assignments", "Asignar cartera", <ContactRound />, activeSection, "/company/customer-assignments")] : []),
    { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
    item("settings", "Configuración", <Settings />, activeSection, "/company/settings"),
  ];
}

function supervisorNavigation(activeSection: SupervisorSection): DashboardNavigationItem[] {
  return [
    item("dashboard", "Resumen", <LayoutDashboard />, activeSection, "/supervisor/dashboard"),
    item("sellers", "Vendedores", <UserRound />, activeSection, "/supervisor/sellers"),
    item("territories", "Zonas", <MapPinned />, activeSection, "/supervisor/territories"),
    clientGroup(activeSection, "/supervisor/clients", "/supervisor/clients/map", false),
    item("settings", "Configuración", <Settings />, activeSection, "/supervisor/settings"),
  ];
}

function item(id: string, label: string, icon: ReactNode, activeSection: string, path: string): DashboardNavigationItem {
  return { id, label, icon, active: id === activeSection, onSelect: () => navigate(path) };
}

function clientGroup(activeSection: string, managementPath: string, mapPath: string | undefined, canManage: boolean): DashboardNavigationItem {
  const active = activeSection === "clients";
  return {
    id: "clients",
    label: "Clientes",
    icon: <ContactRound />,
    active,
    children: [
      { id: "clients-management", label: "Gestión de clientes", icon: <ListFilter />, active: window.location.pathname === managementPath, onSelect: () => navigate(managementPath) },
      ...(mapPath ? [{ id: "clients-map", label: "Mapa general", icon: <Map />, active: window.location.pathname === mapPath, onSelect: () => navigate(mapPath) }] : []),
      ...(canManage ? [{ id: "clients-import", label: "Carga de clientes", icon: <ClipboardList />, active: window.location.pathname === "/company/customer-imports", onSelect: () => navigate("/company/customer-imports") }] : []),
    ],
  };
}
