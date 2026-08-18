import { CirclePause, Eye, MoreVertical, Pencil, Send } from "lucide-react";
import {
  useRef,
  type KeyboardEvent,
  type MutableRefObject,
} from "react";
import {
  DataTable,
  DataTableIdentity,
  DataTablePagination,
  DataTableStatus,
  type DataTableColumn,
} from "../../../shared/ui/DataTable";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { CompanyUser, CompanyUserStatus } from "../types";

const roleLabel = {
  COMPANY_ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
} as const;
const statusLabel = {
  INVITED: "Invitación pendiente",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  LOCKED: "Bloqueado",
} as const;

export function CompanyUsersTable({
  users,
  page,
  totalPages,
  totalElements,
  readOnly,
  menuUser,
  menuTriggers,
  onMenuChange,
  onDetails,
  onEdit,
  onResendInvitation,
  onStatus,
  onPageChange,
}: {
  users: readonly CompanyUser[];
  page: number;
  totalPages: number;
  totalElements: number;
  readOnly: boolean;
  menuUser: string | null;
  menuTriggers: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onMenuChange: (userId: string | null) => void;
  onDetails: (user: CompanyUser) => void;
  onEdit: (user: CompanyUser) => void;
  onResendInvitation: (user: CompanyUser) => void;
  onStatus: (user: CompanyUser) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <>
      <DataTable
        ariaLabel="Administradores y supervisores"
        items={users}
        rowKey={(user) => user.id}
        columns={userColumns({
          readOnly,
          menuUser,
          menuTriggers,
          onMenuChange,
          onDetails,
          onEdit,
          onResendInvitation,
          onStatus,
        })}
      />
      <DataTablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        ariaLabel="Paginación de administradores y supervisores"
        summary={
          <>
            Mostrando {users.length} de {totalElements} administradores y
            supervisores
          </>
        }
      />
    </>
  );
}

function userColumns({
  readOnly,
  menuUser,
  menuTriggers,
  onMenuChange,
  onDetails,
  onEdit,
  onResendInvitation,
  onStatus,
}: {
  readOnly: boolean;
  menuUser: string | null;
  menuTriggers: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onMenuChange: (userId: string | null) => void;
  onDetails: (user: CompanyUser) => void;
  onEdit: (user: CompanyUser) => void;
  onResendInvitation: (user: CompanyUser) => void;
  onStatus: (user: CompanyUser) => void;
}): readonly DataTableColumn<CompanyUser>[] {
  const columns: DataTableColumn<CompanyUser>[] = [
    {
      id: "user",
      header: "Usuario",
      label: "Usuario",
      width: "34%",
      render: (user) => (
        <DataTableIdentity
          mark={initials(user.displayName)}
          primary={user.displayName}
          secondary={user.email}
        />
      ),
    },
    {
      id: "role",
      header: "Rol",
      label: "Rol",
      width: "17%",
      render: (user) => roleLabel[user.role],
    },
    {
      id: "status",
      header: "Estado",
      label: "Estado",
      width: "26%",
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      id: "updated",
      header: "Última actualización",
      label: "Última actualización",
      width: "16%",
      render: (user) => formatDate(user.updatedAt),
    },
  ];
  columns.push({
      id: "actions",
      header: "Acciones",
      label: "Acciones",
      width: "12%",
      align: "center",
      render: (user) => (
        <div className="company-users__actions">
          <button
            ref={(node) => {
              menuTriggers.current[user.id] = node;
            }}
            type="button"
            className="data-table__icon-button"
            aria-label={`Más acciones para ${user.displayName}`}
            aria-expanded={menuUser === user.id}
            onClick={() => onMenuChange(menuUser === user.id ? null : user.id)}
          >
            <MoreVertical aria-hidden="true" />
          </button>
          {menuUser === user.id && (
            <UserActionMenu
              user={user}
              anchor={menuTriggers.current[user.id] ?? null}
              readOnly={readOnly}
              onDetails={() => onDetails(user)}
              onEdit={() => onEdit(user)}
              onResendInvitation={() => onResendInvitation(user)}
              onStatus={() => onStatus(user)}
              onClose={() => {
                onMenuChange(null);
                menuTriggers.current[user.id]?.focus();
              }}
            />
          )}
        </div>
      ),
    });
  return columns;
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
function StatusBadge({ status }: { status: CompanyUserStatus }) {
  return (
    <DataTableStatus
      label={statusLabel[status]}
      tone={
        status === "ACTIVE"
          ? "success"
          : status === "LOCKED"
            ? "danger"
            : "warning"
      }
    />
  );
}
function UserActionMenu({
  user,
  anchor,
  readOnly,
  onClose,
  onDetails,
  onEdit,
  onResendInvitation,
  onStatus,
}: {
  user: CompanyUser;
  anchor: HTMLButtonElement | null;
  readOnly: boolean;
  onClose: () => void;
  onDetails: () => void;
  onEdit: () => void;
  onResendInvitation: () => void;
  onStatus: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(menuRef, onClose);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ??
        [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      items[
        (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) %
          items.length
      ]?.focus();
    }
  };
  return (
    <TableActionMenu
      anchor={anchor}
      menuRef={menuRef}
      ariaLabel={`Acciones de ${user.displayName}`}
      onKeyDown={onKeyDown}
      onDismiss={onClose}
      items={[{ label: "Ver detalle", icon: <Eye aria-hidden="true" />, onSelect: onDetails }, ...(!readOnly ? [user.status === "INVITED" ? { label: "Corregir y reenviar invitación", icon: <Send aria-hidden="true" />, onSelect: onResendInvitation } : { label: "Editar usuario", icon: <Pencil aria-hidden="true" />, onSelect: onEdit }, { label: user.status === "LOCKED" || user.status === "INACTIVE" ? "Reactivar usuario" : "Bloquear usuario", icon: <CirclePause aria-hidden="true" />, tone: user.status === "LOCKED" || user.status === "INACTIVE" ? ("default" as const) : ("danger" as const), onSelect: onStatus }] : [])]}
    />
  );
}
