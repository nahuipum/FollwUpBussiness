import { X } from "lucide-react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { CompanyUser } from "../types";

const roleLabel = { COMPANY_ADMIN: "Administrador", SUPERVISOR: "Supervisor" } as const;
const statusLabel = { INVITED: "Invitado", ACTIVE: "Activo", INACTIVE: "Inactivo", LOCKED: "Bloqueado" } as const;

export function CompanyUserDetailDialog({
  user,
  loading,
  error,
  onClose,
}: {
  user: CompanyUser | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
}) {
  return (
    <ModalSurface titleId="user-detail-title" onDismiss={onClose} className="company-users__dialog">
        <header>
          <h2 id="user-detail-title">Detalle de usuario</h2>
          <button type="button" aria-label="Cerrar detalle" onClick={onClose}><X aria-hidden="true" /></button>
        </header>
        {loading && <p role="status">Cargando detalle…</p>}
        {error && <p role="alert">No pudimos mostrar el detalle del usuario.</p>}
        {user && (
          <dl className="company-users__detail-list">
            <div><dt>Nombre completo</dt><dd>{user.displayName}</dd></div>
            <div><dt>Correo corporativo</dt><dd>{user.email}</dd></div>
            <div><dt>Usuario</dt><dd>{user.username ?? "—"}</dd></div>
            <div><dt>Rol</dt><dd>{roleLabel[user.role]}</dd></div>
            <div><dt>Estado</dt><dd>{statusLabel[user.status]}</dd></div>
          </dl>
        )}
        <footer><button className="company-users__secondary" type="button" onClick={onClose}>Cerrar</button></footer>
    </ModalSurface>
  );
}
