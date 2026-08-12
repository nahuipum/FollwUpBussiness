import { X } from "lucide-react";
import { useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
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
  const dialogRef = useRef<HTMLElement>(null);
  useFocusTrap(dialogRef, onClose);
  return (
    <div className="company-users__dialog-backdrop">
      <section ref={dialogRef} className="company-users__dialog" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
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
      </section>
    </div>
  );
}
