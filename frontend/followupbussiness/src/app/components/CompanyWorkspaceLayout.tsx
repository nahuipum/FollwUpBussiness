import { ClipboardList, ContactRound, LayoutDashboard, MapPinned, Settings, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardLayout, type DashboardNavigationItem } from "../../shared/layout/DashboardLayout";
import { getSessionCompanyLabel, getSessionIdentity, logout } from "../../features/auth/auth";
import { PasswordRecoveryBrandMark } from "../../features/auth/components/BrandPanel";
import { navigate } from "../navigation";

export type CompanySection = "dashboard" | "administrators-supervisors" | "sellers" | "territories" | "clients";
export type SupervisorSection = "dashboard" | "sellers" | "territories";

type Props = {
  activeSection: CompanySection | SupervisorSection;
  workspace: "company" | "supervisor";
  children: ReactNode;
};

const companySections: Record<CompanySection, string> = {
  dashboard: "Resumen",
  "administrators-supervisors": "Administradores y supervisores",
  sellers: "Vendedores",
  territories: "Zonas",
  clients: "Clientes",
};

const supervisorSections: Record<SupervisorSection, string> = {
  dashboard: "Resumen",
  sellers: "Vendedores",
  territories: "Zonas",
};

export function CompanyWorkspaceLayout({ activeSection, workspace, children }: Props) {
  const identity = getSessionIdentity();
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const isSupervisor = workspace === "supervisor";
  const navigation = isSupervisor
    ? supervisorNavigation(activeSection as SupervisorSection)
    : companyNavigation(activeSection as CompanySection, identity?.roles.includes("COMPANY_ADMIN") ?? false);

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel={companyName}
      navigationLabel={isSupervisor ? "Supervisor" : "Empresa"}
      profile={{
        initials: (identity?.displayName ?? "").slice(0, 2).toUpperCase(),
        name: identity?.displayName ?? "",
        role: isSupervisor ? "Supervisor" : "Administradora de empresa",
        scopeLabel: companyName,
      }}
      breadcrumbs={[companyName, isSupervisor ? supervisorSections[activeSection as SupervisorSection] : companySections[activeSection as CompanySection]]}
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
    item("clients", "Clientes", <ContactRound />, activeSection, "/company/clients"),
    { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
    { id: "settings", label: "Configuración", icon: <Settings /> },
  ];
}

function supervisorNavigation(activeSection: SupervisorSection): DashboardNavigationItem[] {
  return [
    item("dashboard", "Resumen", <LayoutDashboard />, activeSection, "/supervisor/dashboard"),
    item("sellers", "Vendedores", <UserRound />, activeSection, "/supervisor/sellers"),
    item("territories", "Zonas", <MapPinned />, activeSection, "/supervisor/territories"),
  ];
}

function item(id: string, label: string, icon: ReactNode, activeSection: string, path: string): DashboardNavigationItem {
  return { id, label, icon, active: id === activeSection, onSelect: () => navigate(path) };
}
