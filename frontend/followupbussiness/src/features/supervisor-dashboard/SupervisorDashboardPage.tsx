type SupervisorDashboardPageProps = {
  view: "dashboard" | "sellers";
};

export function SupervisorDashboardPage({ view }: SupervisorDashboardPageProps) {
  const isDashboard = view === "dashboard";

  return <div aria-label={isDashboard ? "Contenido del dashboard principal de supervisor" : "Contenido de vendedores de supervisor"} />;
}
