import { ClipboardList, LayoutDashboard, Settings, Users } from "lucide-react";
import { useRef } from "react";
import { navigate } from "../../../app/navigation";
import { DashboardLayout } from "../../../shared/layout/DashboardLayout";
import { getSessionCompanyLabel, logout } from "../../auth/auth";
import { PasswordRecoveryBrandMark } from "../../auth/components/BrandPanel";
import {
  correctAndResendCompanyUserInvitation,
  inviteCompanyUser,
  updateCompanyUser,
  updateCompanyUserStatus,
} from "../api";
import { useCompanyUsers } from "../hooks/useCompanyUsers";
import { useCompanyUserDetail } from "../hooks/useCompanyUserDetail";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { CompanyUser, CompanyUserInput } from "../types";
import { CompanyUserInviteDialog } from "./CompanyUserInviteDialog";
import { CompanyUserDetailDialog } from "./CompanyUserDetailDialog";
import { CompanyUsersFilters } from "./CompanyUsersFilters";
import { CompanyUsersHeader } from "./CompanyUsersHeader";
import { CompanyUsersStateCard } from "./CompanyUsersStateCard";
import { CompanyUsersTable, ReadOnlyNotice } from "./CompanyUsersTable";
import { ApiRequestObsoleteError, normalizeApiError } from "../../../lib/api";

export function CompanyUsersPage() {
  const users = useCompanyUsers();
  const details = useCompanyUserDetail();
  const companyName = getSessionCompanyLabel() ?? "Empresa";
  const saveUser = async (input: CompanyUserInput) => {
    if (users.submitting) return;
    users.setSubmitting(true);
    users.setError(null);
    const mutationId = users.startMutation();
    try {
      const current = users.editingUser;
      const resending = users.resendingUser;
      const result = resending
        ? await correctAndResendCompanyUserInvitation(resending, input)
        : current
        ? await updateCompanyUser(current, input)
        : await inviteCompanyUser(input);
      if (!users.isCurrentMutation(mutationId)) return;
      if (
        (resending
          ? result.response.status === 202
          : result.response.status === 200 || result.response.status === 202) &&
        result.user
      ) {
        if (resending) {
          users.replaceUser(result.user);
          users.setResendingUser(null);
          users.setNotice("La nueva entrega de invitación fue aceptada.");
        } else users.setEditingUser(null);
        users.setInviteOpen(false);
        if (!resending) users.retry();
      } else {
        const error = await normalizeApiError(result.response);
        if (users.isCurrentMutation(mutationId)) users.setError(error);
      }
    } catch (reason) {
      if (
        users.isCurrentMutation(mutationId) &&
        !(reason instanceof ApiRequestObsoleteError)
      )
        users.setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (users.isCurrentMutation(mutationId)) users.setSubmitting(false);
    }
  };
  const changeStatus = async () => {
    const current = users.statusUser;
    if (!current || users.submitting) return;
    users.setSubmitting(true);
    users.setError(null);
    const mutationId = users.startMutation();
    try {
      const next = current.status === "LOCKED" || current.status === "INACTIVE"
        ? "ACTIVE"
        : "LOCKED";
      const result = await updateCompanyUserStatus(current, next);
      if (!users.isCurrentMutation(mutationId)) return;
      if (result.response.status === 200 && result.user) {
        users.replaceUser(result.user);
        users.setStatusUser(null);
      } else {
        const error = await normalizeApiError(result.response);
        if (users.isCurrentMutation(mutationId)) users.setError(error);
      }
    } catch (reason) {
      if (
        users.isCurrentMutation(mutationId) &&
        !(reason instanceof ApiRequestObsoleteError)
      )
        users.setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (users.isCurrentMutation(mutationId)) users.setSubmitting(false);
    }
  };
  const items = users.result?.items ?? [];
  return (
    <DashboardLayout
      brand={
        <>
          <PasswordRecoveryBrandMark />
          FollowUpBusiness
        </>
      }
      contextLabel={companyName}
      navigationLabel="Empresa"
      profile={{
        initials: users.displayName.slice(0, 2).toUpperCase(),
        name: users.displayName,
        role: users.canManage ? "Administradora de empresa" : "Supervisor",
        scopeLabel: companyName,
      }}
      breadcrumbs={[companyName, "Administradores y supervisores"]}
      topbarContext={companyName}
      onLogout={() => {
        void logout();
        navigate("/", { replace: true });
      }}
      navigation={[
        {
          id: "dashboard",
          label: "Resumen",
          icon: <LayoutDashboard />,
          onSelect: () => navigate("/company/dashboard"),
        },
        {
          id: "administrators-supervisors",
          label: "Administradores y supervisores",
          icon: <Users />,
          active: true,
        },
        { id: "audit", label: "Auditoría", icon: <ClipboardList /> },
        { id: "settings", label: "Configuración", icon: <Settings /> },
      ]}
    >
      <section className="company-users" aria-labelledby="company-users-title">
        <CompanyUsersHeader
          readOnly={!users.canManage}
          inviteButtonRef={users.inviteButtonRef}
          onInvite={() => users.setInviteOpen(true)}
        />
        {users.error && (
          <CompanyUsersStateCard
            title={
              users.error.status === 403
                ? "No tienes permisos"
                : "Ocurrió un problema temporal"
            }
            description={
              users.error.status === 403
                ? "No tienes permiso para realizar esta acción."
                : "No pudimos mostrar los usuarios. Inténtalo más tarde."
            }
            action="Reintentar"
            onAction={users.retry}
          />
        )}
        {users.notice && (
          <p className="company-users__notice" role="status">
            {users.notice}
          </p>
        )}
        <section
          className="company-users__card"
          aria-label="Lista de administradores y supervisores"
        >
          {!users.canManage && <ReadOnlyNotice />}
          <CompanyUsersFilters
            query={users.search}
            role={users.role}
            status={users.status}
            onQueryChange={users.changeSearch}
            onRoleChange={users.changeRole}
            onStatusChange={users.changeStatus}
          />
          {users.loading ? (
            <p role="status">Cargando usuarios…</p>
          ) : items.length === 0 ? (
            <CompanyUsersStateCard
              title={
                users.search || users.role || users.status
                  ? "No encontramos coincidencias"
                  : "Aún no hay usuarios"
              }
              description="Invita a tu equipo para comenzar a colaborar."
              action={
                users.search || users.role || users.status
                  ? "Limpiar búsqueda"
                  : "Invitar usuario"
              }
              onAction={
                users.search || users.role || users.status
                  ? users.clearFilters
                  : () => users.setInviteOpen(true)
              }
            />
          ) : (
            <CompanyUsersTable
              users={items}
              page={users.page}
              totalPages={users.result?.page.totalPages ?? 0}
              totalElements={users.result?.page.totalElements ?? items.length}
              readOnly={!users.canManage}
              menuUser={users.menuUser}
              menuTriggers={users.menuTriggers}
              onMenuChange={users.setMenuUser}
              onDetails={(user) => {
                users.setMenuUser(null);
                void details.open(user.id);
              }}
              onEdit={(user) => {
                users.setMenuUser(null);
                users.setEditingUser(user);
              }}
              onResendInvitation={(user) => {
                users.setMenuUser(null);
                users.setResendingUser(user);
              }}
              onStatus={(user) => {
                users.setMenuUser(null);
                users.setStatusUser(user);
              }}
              onPageChange={users.goToPage}
            />
          )}
        </section>
        {(users.inviteOpen || users.editingUser || users.resendingUser) && (
          <CompanyUserInviteDialog
            user={users.resendingUser ?? users.editingUser}
            mode={
              users.resendingUser
                ? "resend"
                : users.editingUser
                  ? "edit"
                  : "invite"
            }
            busy={users.submitting}
            error={
              users.error
                ? mutationErrorMessage(users.error.status)
                : null
            }
            onClose={() => {
              users.setInviteOpen(false);
              users.setEditingUser(null);
              users.setResendingUser(null);
              users.setError(null);
            }}
            onSubmit={saveUser}
            returnFocusRef={users.inviteButtonRef}
          />
        )}
        {users.statusUser && (
          <StatusConfirmation
            user={users.statusUser}
            busy={users.submitting}
            error={users.error !== null}
            onClose={() => users.setStatusUser(null)}
            onConfirm={changeStatus}
            returnFocusTarget={
              users.menuTriggers.current[users.statusUser.id] ?? null
            }
          />
        )}
        {(details.loading || details.user !== null || details.error !== null) && (
          <CompanyUserDetailDialog
            user={details.user}
            loading={details.loading}
            error={details.error !== null}
            onClose={details.close}
          />
        )}
      </section>
    </DashboardLayout>
  );
}

function mutationErrorMessage(status: number) {
  switch (status) {
    case 401:
      return "Tu sesión ya no es válida. Inicia sesión nuevamente.";
    case 403:
      return "No tienes permiso para realizar esta acción.";
    case 404:
      return "El usuario ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
    case 409:
      return "Los datos cambiaron o entran en conflicto. Actualiza la lista antes de reintentar.";
    case 422:
      return "Revisa la información ingresada e inténtalo nuevamente.";
    case 503:
      return "El servicio no está disponible temporalmente. Inténtalo más tarde.";
    default:
      return "No pudimos guardar los cambios. Inténtalo nuevamente.";
  }
}

function StatusConfirmation({
  user,
  busy,
  error,
  onClose,
  onConfirm,
  returnFocusTarget,
}: {
  user: CompanyUser;
  busy: boolean;
  error: boolean;
  onClose: () => void;
  onConfirm: () => void;
  returnFocusTarget: HTMLButtonElement | null;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef(returnFocusTarget);
  useFocusTrap(dialogRef, onClose, returnFocusRef);
  const reactivate = user.status === "LOCKED" || user.status === "INACTIVE";
  return (
    <div className="company-users__dialog-backdrop">
      <section
        ref={dialogRef}
        className="company-users__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-title"
      >
        <header>
          <h2 id="status-title">
            {reactivate ? "Reactivar usuario" : "Bloquear usuario"}
          </h2>
        </header>
        <p>
          {reactivate
            ? "¿Deseas reactivar este usuario?"
            : "¿Deseas bloquear este usuario?"}
        </p>
        {error && <p role="alert">No fue posible actualizar el usuario.</p>}
        <footer>
          <button
            className="company-users__secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            className="company-users__primary"
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? "Guardando…"
              : reactivate
                ? "Reactivar usuario"
                : "Bloquear usuario"}
          </button>
        </footer>
      </section>
    </div>
  );
}
