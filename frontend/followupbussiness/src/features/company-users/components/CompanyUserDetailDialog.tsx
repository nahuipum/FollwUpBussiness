import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import type { ApiError } from "../../../lib/api";
import type { CompanyUser } from "../types";

const roleLabel = { COMPANY_ADMIN: "Administrador", SUPERVISOR: "Supervisor" } as const;
const statusLabel = { INVITED: "Invitado", ACTIVE: "Activo", INACTIVE: "Inactivo", LOCKED: "Bloqueado" } as const;

export function CompanyUserDetailDialog({
  user,
  loading,
  error,
  onRetry,
  onClose,
}: {
  user: CompanyUser | null;
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <ModalSurface titleId="user-detail-title" onDismiss={onClose} className="company-users__dialog">
        <ModalHeader module="Usuarios" title="Detalle de usuario" titleId="user-detail-title" onClose={onClose} closeLabel="Cerrar detalle" />
        {loading && <ModalAsyncState state="loading" title="Cargando usuario" message="Estamos obteniendo la información más reciente." />}
        {error && <ModalAsyncState state="error" title="No pudimos cargar el usuario" message="No logramos obtener la información actual. Reintenta en unos segundos." correlationId={error.correlationId} primaryAction={{ label: "Reintentar", onClick: onRetry }} secondaryAction={{ label: "Cerrar", onClick: onClose }} />}
        {user && (
          <dl className="company-users__detail-list">
            <div><dt>Nombre completo</dt><dd>{user.displayName}</dd></div>
            <div><dt>Correo corporativo</dt><dd>{user.email}</dd></div>
            <div><dt>Usuario</dt><dd>{user.username ?? "—"}</dd></div>
            <div><dt>Rol</dt><dd>{roleLabel[user.role]}</dd></div>
            <div><dt>Estado</dt><dd>{statusLabel[user.status]}</dd></div>
          </dl>
        )}
        {user && <footer><button className="company-users__secondary" type="button" onClick={onClose}>Cerrar</button></footer>}
    </ModalSurface>
  );
}
