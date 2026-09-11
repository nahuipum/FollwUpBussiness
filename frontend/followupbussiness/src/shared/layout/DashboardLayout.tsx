import { ChevronDown, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { applyTheme, getStoredTheme, persistTheme, type AppTheme } from "../theme/theme";
import "./dashboard-layout.css";

export type DashboardNavigationItem = { id: string; label: string; description?: string; icon: ReactNode; active?: boolean; disabled?: boolean; onSelect?: () => void; children?: readonly DashboardNavigationChild[] };
type DashboardNavigationChild = { id: string; label: string; icon: ReactNode; description?: string; active?: boolean; disabled?: boolean; onSelect?: () => void };
type DashboardProfile = { initials: string; name: string; role: string; scopeLabel?: string };
type DashboardLayoutProps = { brand: ReactNode; contextLabel: string; navigationLabel: string; navigation: DashboardNavigationItem[]; profile: DashboardProfile; breadcrumbs: string[]; onLogout?: () => void; children: ReactNode };

export function DashboardLayout({ brand, contextLabel, navigationLabel, navigation, profile, breadcrumbs, onLogout, children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuId = useId();
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { const previous = document.body.style.overflow; if (isMenuOpen) document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [isMenuOpen]);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileMenuOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { if (isProfileMenuOpen) { setIsProfileMenuOpen(false); profileButtonRef.current?.focus(); } else if (isMenuOpen) { setIsMenuOpen(false); menuButtonRef.current?.focus(); } } };
    document.addEventListener("mousedown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [isMenuOpen, isProfileMenuOpen]);
  const closeMenu = (focus = false) => { setIsMenuOpen(false); if (focus) menuButtonRef.current?.focus(); };
  const select = (action?: () => void) => { action?.(); closeMenu(); };
  const toggleTheme = () => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); persistTheme(next); };
  return <div className="dashboard-shell">
    <aside id="dashboard-sidebar" className={`dashboard-sidebar${isMenuOpen ? " dashboard-sidebar--open" : ""}`} aria-label="Navegación principal">
      <div className="dashboard-sidebar__brand">{brand}</div><span className="dashboard-sidebar__context">{contextLabel}</span>
      <div className="dashboard-sidebar__nav-region"><p className="dashboard-sidebar__label">{navigationLabel}</p><nav className="dashboard-nav" aria-label={`Secciones de ${navigationLabel}`}>{navigation.map((item) => {
        const hasChildren = Boolean(item.children?.length); const expanded = expandedGroups[item.id] ?? Boolean(item.active); const groupId = `dashboard-nav-group-${item.id}`;
        if (!hasChildren) return <button key={item.id} className={`dashboard-nav__item${item.active ? " dashboard-nav__item--active" : ""}`} type="button" disabled={item.disabled} aria-current={item.active ? "page" : undefined} onClick={() => select(item.onSelect)}><span aria-hidden="true">{item.icon}</span><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span></button>;
        return <section key={item.id} className="dashboard-nav__group"><button className={`dashboard-nav__item dashboard-nav__item--group${item.active ? " dashboard-nav__item--active" : ""}`} type="button" aria-expanded={expanded} aria-controls={groupId} onClick={() => setExpandedGroups((current) => ({ ...current, [item.id]: !expanded }))}><span aria-hidden="true">{item.icon}</span><span><strong>{item.label}</strong></span><ChevronDown className="dashboard-nav__chevron" aria-hidden="true" /></button>{expanded && <div id={groupId} className="dashboard-nav__children" role="group" aria-label={`Opciones de ${item.label}`}>{item.children?.map((child) => <button key={child.id} className={`dashboard-nav__child${child.active ? " dashboard-nav__child--active" : ""}`} type="button" disabled={child.disabled} aria-current={child.active ? "page" : undefined} onClick={() => select(child.onSelect)}><span aria-hidden="true">{child.icon}</span><span><strong>{child.label}</strong>{child.description && <small>{child.description}</small>}</span></button>)}</div>}</section>;
      })}</nav></div>
      <section className="dashboard-profile" aria-label="Contexto de usuario"><span className="dashboard-avatar">{profile.initials}</span><span><strong>{profile.name}</strong><small>{profile.role}</small></span>{profile.scopeLabel && <p>{profile.scopeLabel}</p>}{onLogout && <button className="dashboard-sidebar__logout" type="button" onClick={onLogout}><LogOut aria-hidden="true" />Cerrar sesión</button>}</section>
    </aside>{isMenuOpen && <button className="dashboard-backdrop" type="button" aria-label="Cerrar menú" onClick={() => closeMenu(true)} />}
    <section className="dashboard-workspace"><header className="dashboard-topbar"><div className="dashboard-topbar__left"><button ref={menuButtonRef} className="dashboard-menu-button" type="button" aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={isMenuOpen} aria-controls="dashboard-sidebar" onClick={() => setIsMenuOpen((value) => !value)}>{isMenuOpen ? <X /> : <Menu />}</button><div className="dashboard-breadcrumbs" aria-label="Breadcrumbs">{breadcrumbs.map((breadcrumb, index) => <span key={`${breadcrumb}-${index}`} className={index === breadcrumbs.length - 1 ? "dashboard-breadcrumbs__current" : ""} aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{breadcrumb}</span>)}</div></div><div className="dashboard-top-actions"><button className="dashboard-theme-toggle" type="button" role="switch" aria-checked={theme === "dark"} aria-label="Modo oscuro" onClick={toggleTheme}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button><div ref={profileMenuRef} className="dashboard-top-profile-menu"><button ref={profileButtonRef} className="dashboard-top-profile" type="button" aria-label={`Abrir opciones del perfil de ${profile.name}`} aria-haspopup="menu" aria-controls={profileMenuId} aria-expanded={isProfileMenuOpen} onClick={() => setIsProfileMenuOpen((value) => !value)}><span className="dashboard-avatar">{profile.initials}</span><span><strong>{profile.name}</strong><small>{profile.role}</small></span><ChevronDown aria-hidden="true" /></button>{isProfileMenuOpen && <div id={profileMenuId} className="dashboard-profile-menu" role="menu"><div className="dashboard-profile-menu__identity"><strong>{profile.name}</strong><span>{profile.scopeLabel}</span></div>{onLogout && <button type="button" role="menuitem" onClick={onLogout}><LogOut aria-hidden="true" />Cerrar sesión</button>}</div>}</div></div></header><main id="main-content" className="dashboard-content">{children}</main></section>
  </div>;
}
