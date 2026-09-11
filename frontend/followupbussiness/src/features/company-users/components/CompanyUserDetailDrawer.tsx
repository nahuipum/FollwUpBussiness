import { X } from "lucide-react";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { CorrelationId } from "../../../shared/ui/error-ui/components/CorrelationId";
import type { ApiError } from "../../../lib/api";
import type { CompanyUser } from "../types";

const roleLabel = { COMPANY_ADMIN: "Administrador", SUPERVISOR: "Supervisor" } as const;
const statusLabel = { INVITED: "Invitación pendiente", ACTIVE: "Activo", INACTIVE: "Inactivo", LOCKED: "Bloqueado" } as const;

export function CompanyUserDetailDrawer({ user, loading, error, onRetry, onClose }: { user: CompanyUser | null; loading: boolean; error: ApiError | null; onRetry: () => void; onClose: () => void }) {
  return <DrawerSurface titleId="user-detail-title" descriptionId="user-detail-description" onDismiss={onClose} className="company-users__drawer" header={<div className="company-users__drawer-header"><div><span className="company-users__eyebrow">Usuarios</span><h2 id="user-detail-title">Detalle de usuario</h2><p id="user-detail-description">Información actual del registro seleccionado.</p></div><button className="company-users__drawer-close" type="button" aria-label="Cerrar detalle" onClick={onClose}><X aria-hidden="true" /></button></div>} footer={<><button className="company-users__secondary" type="button" onClick={onClose}>Cerrar</button>{error && <button className="company-users__primary" type="button" onClick={onRetry}>Reintentar</button>}</>}>
    {loading && <section className="company-users__drawer-state" aria-busy="true"><div><h3>Cargando detalle</h3><p>Estamos obteniendo la información más reciente.</p></div></section>}
    {error && <section className="company-users__drawer-state"><div><h3>No pudimos cargar el usuario</h3><p>No logramos obtener la información actual. Reintenta en unos segundos.</p>{error.correlationId && <CorrelationId correlationId={error.correlationId} />}</div></section>}
    {user && <section className="company-users__detail" aria-label="Información del usuario"><div className="company-users__detail-identity"><span className="company-users__detail-mark" aria-hidden="true">{initials(user.displayName)}</span><span><strong>{user.displayName}</strong><small>{user.email}</small></span></div><dl className="company-users__detail-grid"><div><dt>Correo corporativo</dt><dd>{user.email}</dd></div><div><dt>Usuario</dt><dd>{user.username ?? "—"}</dd></div><div><dt>Rol</dt><dd>{roleLabel[user.role]}</dd></div><div><dt>Estado</dt><dd><span className={`company-users__detail-status company-users__detail-status--${user.status.toLowerCase()}`}>{statusLabel[user.status]}</span></dd></div></dl></section>}
  </DrawerSurface>;
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part.at(0)?.toUpperCase() ?? "").join(""); }
