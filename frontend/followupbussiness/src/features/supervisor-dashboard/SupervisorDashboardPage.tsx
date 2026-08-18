import { LayoutDashboard, Users } from "lucide-react";
import { navigate } from "../../app/navigation";
import { getSessionCompanyLabel, getSessionIdentity, logout } from "../auth/auth";
import { PasswordRecoveryBrandMark } from "../auth/components/BrandPanel";
import { DashboardLayout } from "../../shared/layout/DashboardLayout";

type SupervisorDashboardPageProps = {
  view: "dashboard" | "sellers";
};

export function SupervisorDashboardPage({ view }: SupervisorDashboardPageProps) {
  const identity = getSessionIdentity();
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const displayName = identity?.displayName ?? "";
  const isDashboard = view === "dashboard";

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel={companyName}
      navigationLabel="Supervisor"
      profile={{
        initials: displayName.slice(0, 2).toUpperCase(),
        name: displayName,
        role: "Supervisor",
        scopeLabel: companyName,
      }}
      breadcrumbs={[companyName, isDashboard ? "Resumen" : "Vendedores"]}
      topbarContext={companyName}
      onLogout={() => {
        void logout();
        navigate("/", { replace: true });
      }}
      navigation={[
        { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, active: isDashboard, onSelect: () => navigate("/supervisor/dashboard") },
        { id: "sellers", label: "Vendedores", icon: <Users />, active: !isDashboard, onSelect: () => navigate("/supervisor/sellers") },
      ]}
    >
      <div aria-label={isDashboard ? "Contenido del dashboard principal de supervisor" : "Contenido de vendedores de supervisor"} />
    </DashboardLayout>
  );
}
