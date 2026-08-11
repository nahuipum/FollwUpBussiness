import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import "./dashboard-layout.css";

export type DashboardNavigationItem = {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  active?: boolean;
  onSelect?: () => void;
};

export type DashboardProfile = {
  initials: string;
  name: string;
  role: string;
  scopeLabel?: string;
};

type DashboardLayoutProps = {
  brand: ReactNode;
  contextLabel: string;
  navigationLabel: string;
  navigation: DashboardNavigationItem[];
  profile: DashboardProfile;
  breadcrumbs: string[];
  topbarContext?: ReactNode;
  children: ReactNode;
};

export function DashboardLayout({ brand, contextLabel, navigationLabel, navigation, profile, breadcrumbs, topbarContext, children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar${isMenuOpen ? " dashboard-sidebar--open" : ""}`} aria-label="Navegación principal">
        <div className="dashboard-sidebar__brand">{brand}</div>
        <span className="dashboard-sidebar__context">{contextLabel}</span>
        <p className="dashboard-sidebar__label">{navigationLabel}</p>
        <nav className="dashboard-nav">
          {navigation.map((item) => (
            <button key={item.id} className={`dashboard-nav__item${item.active ? " dashboard-nav__item--active" : ""}`} type="button" onClick={() => { item.onSelect?.(); setIsMenuOpen(false); }}>
              <span aria-hidden="true">{item.icon}</span>
              <span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span>
            </button>
          ))}
        </nav>
        <section className="dashboard-profile" aria-label="Contexto de usuario">
          <span className="dashboard-avatar">{profile.initials}</span>
          <span><strong>{profile.name}</strong><small>{profile.role}</small></span>
          {profile.scopeLabel && <p>{profile.scopeLabel}</p>}
        </section>
      </aside>
      {isMenuOpen && <button className="dashboard-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setIsMenuOpen(false)} />}
      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" type="button" aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setIsMenuOpen((value) => !value)}>{isMenuOpen ? <X /> : <Menu />}</button>
          <div className="dashboard-breadcrumbs">{breadcrumbs.map((breadcrumb, index) => <span key={breadcrumb} className={index === breadcrumbs.length - 1 ? "dashboard-breadcrumbs__current" : ""}>{breadcrumb}</span>)}</div>
          <div className="dashboard-top-actions">{topbarContext && <span className="dashboard-context-chip">{topbarContext}</span>}<div className="dashboard-top-profile"><span className="dashboard-avatar">{profile.initials}</span><span><strong>{profile.name}</strong><small>{profile.role}</small></span></div></div>
        </header>
        <main className="dashboard-content">{children}</main>
      </section>
    </div>
  );
}
