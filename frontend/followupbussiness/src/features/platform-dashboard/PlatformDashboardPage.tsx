import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { navigate } from "../../app/navigation";
import { getSessionIdentity, logout } from "../auth/auth";
import { PasswordRecoveryBrandMark } from "../auth/components/BrandPanel";
import { DashboardLayout } from "../../shared/layout/DashboardLayout";

export function PlatformDashboardPage() {
  const identity = getSessionIdentity();
  const displayName = identity?.displayName ?? "";

  return (
    <DashboardLayout
      brand={
        <>
          <span className="platform-logo"><PasswordRecoveryBrandMark /></span>
          FollowUpBusiness
        </>
      }
      contextLabel="Plataforma"
      navigationLabel="Plataforma"
      profile={{
        initials: displayName.slice(0, 2).toUpperCase(),
        name: displayName,
        role: "Superadministrador",
        scopeLabel: "Acceso de plataforma",
      }}
      breadcrumbs={["Plataforma", "Resumen"]}
      topbarContext="Plataforma"
      onLogout={() => {
        void logout();
        navigate("/", { replace: true });
      }}
      navigation={[
        { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, active: true },
        {
          id: "companies",
          label: "Gestión de empresas",
          description: "Onboarding y gestión",
          icon: <Building2 />,
          onSelect: () => navigate("/platform/companies"),
        },
        { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
        { id: "settings", label: "Configuración", icon: <Settings /> },
      ]}
    >
      <div aria-label="Contenido del panel de plataforma" />
    </DashboardLayout>
  );
}
