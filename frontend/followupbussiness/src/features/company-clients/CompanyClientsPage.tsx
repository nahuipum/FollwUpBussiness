import { ClipboardList, ContactRound, LayoutDashboard, Settings, UserRound, Users } from "lucide-react";
import { navigate } from "../../app/navigation";
import { getSessionCompanyLabel, getSessionIdentity, logout } from "../auth/auth";
import { PasswordRecoveryBrandMark } from "../auth/components/BrandPanel";
import { DashboardLayout } from "../../shared/layout/DashboardLayout";

export function CompanyClientsPage() {
  const identity = getSessionIdentity();
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const displayName = identity?.displayName ?? "";

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel={companyName}
      navigationLabel="Empresa"
      profile={{
        initials: displayName.slice(0, 2).toUpperCase(),
        name: displayName,
        role: "Administradora de empresa",
        scopeLabel: companyName,
      }}
      breadcrumbs={[companyName, "Clientes"]}
      topbarContext={companyName}
      onLogout={() => {
        void logout();
        navigate("/", { replace: true });
      }}
      navigation={[
        { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, onSelect: () => navigate("/company/dashboard") },
        { id: "administrators-supervisors", label: "Administradores y supervisores", icon: <Users />, onSelect: () => navigate("/company/administrators-supervisors") },
        { id: "sellers", label: "Vendedores", icon: <UserRound />, onSelect: () => navigate("/company/sellers") },
        { id: "clients", label: "Clientes", icon: <ContactRound />, active: true },
        { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
        { id: "settings", label: "Configuración", icon: <Settings /> },
      ]}
    >
      <div aria-label="Contenido de clientes de empresa" />
    </DashboardLayout>
  );
}
