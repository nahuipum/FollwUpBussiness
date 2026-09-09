import { Building2, ClipboardList, LayoutDashboard, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardLayout, type DashboardNavigationItem } from "../../shared/layout/DashboardLayout";
import { getSessionIdentity, logout } from "../../features/auth/auth";
import { PasswordRecoveryBrandMark } from "../../features/auth/components/BrandPanel";
import { navigate } from "../navigation";

type PlatformSection = "dashboard" | "companies";

export function PlatformWorkspaceLayout({ activeSection, children }: { activeSection: PlatformSection; children: ReactNode }) {
  const displayName = getSessionIdentity()?.displayName ?? "";
  const navigation: DashboardNavigationItem[] = [
    { id: "dashboard", label: "Resumen", icon: <LayoutDashboard />, active: activeSection === "dashboard", onSelect: () => navigate("/platform/dashboard") },
    { id: "companies", label: "Gestión de empresas", description: "Onboarding y gestión", icon: <Building2 />, active: activeSection === "companies", onSelect: () => navigate("/platform/companies") },
    { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
    { id: "settings", label: "Configuración", icon: <Settings /> },
  ];

  return (
    <DashboardLayout
      brand={<><span className="platform-logo"><PasswordRecoveryBrandMark /></span>FollowUpBusiness</>}
      contextLabel="Plataforma"
      navigationLabel="Plataforma"
      profile={{ initials: displayName.slice(0, 2).toUpperCase(), name: displayName, role: "Superadministrador", scopeLabel: "Acceso de plataforma" }}
      breadcrumbs={["Plataforma", activeSection === "dashboard" ? "Resumen" : "Gestión de empresas"]}
      onLogout={() => { void logout(); navigate("/", { replace: true }); }}
      navigation={navigation}
    >
      {children}
    </DashboardLayout>
  );
}
