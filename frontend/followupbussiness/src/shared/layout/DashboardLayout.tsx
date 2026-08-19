import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { applyTheme, getStoredTheme, persistTheme, type AppTheme } from "../theme/theme";
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
  onLogout?: () => void;
  children: ReactNode;
};

export function DashboardLayout({ brand, contextLabel, navigationLabel, navigation, profile, breadcrumbs, topbarContext, onLogout, children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuId = useId();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", closeWhenOutside);
    return () => document.removeEventListener("mousedown", closeWhenOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    persistTheme(nextTheme);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
    profileButtonRef.current?.focus();
  };

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
          {onLogout && <button className="dashboard-sidebar__logout" type="button" onClick={onLogout}><LogOut aria-hidden="true" />Cerrar sesión</button>}
        </section>
      </aside>
      {isMenuOpen && <button className="dashboard-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setIsMenuOpen(false)} />}
      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" type="button" aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setIsMenuOpen((value) => !value)}>{isMenuOpen ? <X /> : <Menu />}</button>
          <div className="dashboard-breadcrumbs">{breadcrumbs.map((breadcrumb, index) => <span key={breadcrumb} className={index === breadcrumbs.length - 1 ? "dashboard-breadcrumbs__current" : ""}>{breadcrumb}</span>)}</div>
          <div className="dashboard-top-actions">
            {topbarContext && <span className="dashboard-context-chip">{topbarContext}</span>}
            <div ref={profileMenuRef} className="dashboard-top-profile-menu">
              <button
                ref={profileButtonRef}
                className="dashboard-top-profile"
                type="button"
                aria-label={`Abrir opciones del perfil de ${profile.name}`}
                aria-haspopup="menu"
                aria-controls={profileMenuId}
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((value) => !value)}
              >
                <span className="dashboard-avatar">{profile.initials}</span>
                <span><strong>{profile.name}</strong><small>{profile.role}</small></span>
              </button>
              {isProfileMenuOpen && (
                <div
                  id={profileMenuId}
                  className="dashboard-profile-menu"
                  role="menu"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") closeProfileMenu();
                  }}
                >
                  <button type="button" role="menuitemcheckbox" aria-checked={theme === "dark"} onClick={toggleTheme}>
                    {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                    <span>Modo oscuro<small>{theme === "dark" ? "Activado" : "Desactivado"}</small></span>
                    <span className="dashboard-theme-switch" aria-hidden="true"><span /></span>
                  </button>
                  {onLogout && <button type="button" role="menuitem" onClick={onLogout}><LogOut aria-hidden="true" />Cerrar sesión</button>}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </section>
    </div>
  );
}
