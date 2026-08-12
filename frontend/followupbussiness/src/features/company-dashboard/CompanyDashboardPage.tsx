import { ClipboardList, LayoutDashboard, Settings, Users } from "lucide-react";
import { navigate } from "../../app/navigation";
import { getSessionCompanyLabel, getSessionIdentity, logout } from "../auth/auth";
import { PasswordRecoveryBrandMark } from "../auth/components/BrandPanel";
import { DashboardLayout } from "../../shared/layout/DashboardLayout";

export function CompanyDashboardPage() {
  const identity = getSessionIdentity();
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const isSupervisor = identity?.roles.includes("SUPERVISOR") ?? false;
  const displayName = identity?.displayName ?? "";

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel={companyName}
      navigationLabel="Empresa"
      profile={{
        initials: displayName.slice(0, 2).toUpperCase(),
        name: displayName,
        role: isSupervisor ? "Supervisor" : "Administradora de empresa",
        scopeLabel: companyName,
      }}
      breadcrumbs={[companyName, "Resumen"]}
      topbarContext={companyName}
      onLogout={() => {
        void logout();
        navigate("/", { replace: true });
      }}
      navigation={[
        { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, active: true },
        { id: "administrators-supervisors", label: "Administradores y supervisores", icon: <Users />, onSelect: () => navigate("/company/administrators-supervisors") },
        { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
        { id: "settings", label: "Configuración", icon: <Settings /> },
      ]}
    >
      <div aria-label="Contenido del panel de empresa" />
    </DashboardLayout>
  );
}
