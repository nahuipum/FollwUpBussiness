import { AlertTriangle, ArrowRight, LockKeyhole, Plus, Search, Shield, Users } from "lucide-react";
import { useRef } from "react";
import {
  correctAndResendCompanyUserInvitation,
  inviteCompanyUser,
  updateCompanyUser,
  updateCompanyUserStatus,
} from "../api";
import { useCompanyUsers } from "../hooks/useCompanyUsers";
import { useCompanyUserDetail } from "../hooks/useCompanyUserDetail";
import type { CompanyUser, CompanyUserInput } from "../types";
import { CompanyUserFormDrawer } from "./CompanyUserFormDrawer";
import { CompanyUserDetailDrawer } from "./CompanyUserDetailDrawer";
import { CompanyUsersFilters } from "./CompanyUsersFilters";
import { CompanyUsersHeader } from "./CompanyUsersHeader";
import { CompanyUsersTable } from "./CompanyUsersTable";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { TableLoadingIndicator } from "../../../shared/ui/TableLoadingIndicator";
import { ReadOnlyNotice } from "../../../shared/ui/ReadOnlyNotice";
import { AsyncStateCard } from "../../../shared/ui/AsyncStateCard";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import { DataTablePagination } from "../../../shared/ui/DataTable";
import {
  DataTablePanel,
  DataTableResultsHeader,
} from "../../../shared/ui/DataTableWorkspace";
import { navigate } from "../../../app/navigation";

export function CompanyUsersPage() {
  const users = useCompanyUsers();
  const details = useCompanyUserDetail();
  const saveUser = async (input: CompanyUserInput) => {
    if (users.submitting) return;
    users.setSubmitting(true);
    users.setMutationError(null);
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
        if (users.isCurrentMutation(mutationId)) users.setMutationError(error);
      }
    } catch (reason) {
      if (
        users.isCurrentMutation(mutationId) &&
        !(reason instanceof ApiRequestObsoleteError)
      )
        users.setMutationError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (users.isCurrentMutation(mutationId)) users.setSubmitting(false);
    }
  };
  const changeStatus = async () => {
    const current = users.statusUser;
    if (!current || users.submitting) return;
    users.setSubmitting(true);
    users.setMutationError(null);
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
        if (users.isCurrentMutation(mutationId)) users.setMutationError(error);
      }
    } catch (reason) {
      if (
        users.isCurrentMutation(mutationId) &&
        !(reason instanceof ApiRequestObsoleteError)
      )
        users.setMutationError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (users.isCurrentMutation(mutationId)) users.setSubmitting(false);
    }
  };
  const items = users.result?.items ?? [];
  const showResults = users.loading || items.length > 0;
  if (users.error?.status === 403) {
    return (
      <section className="company-users company-users__forbidden" aria-labelledby="company-users-forbidden-title">
        <AsyncStateCard
          title="No tienes permisos"
          description="No tienes permiso para consultar administradores y supervisores en esta empresa."
          actionLabel="Volver al resumen"
          onAction={() => navigate("/company/dashboard")}
          tone="error"
          variant="golden"
          icon={<AlertTriangle />}
          correlationId={users.error.correlationId}
        />
      </section>
    );
  }
  return (
    <section className="company-users" aria-labelledby="company-users-title">
        <CompanyUsersHeader
          readOnly={!users.canManage}
          inviteButtonRef={users.inviteButtonRef}
          onInvite={() => users.setInviteOpen(true)}
        />
        {users.notice && (
          <p className="company-users__notice" role="status">
            {users.notice}
          </p>
        )}
        <DataTablePanel ariaLabel="Lista de administradores y supervisores">
          {!users.canManage && <ReadOnlyNotice variant="golden" />}
          <CompanyUsersFilters
            query={users.search}
            role={users.role}
            status={users.status}
            onQueryChange={users.changeSearch}
            onRoleChange={users.changeRole}
            onStatusChange={users.changeStatus}
          />
          {users.error && !items.length ? (
            <AsyncStateCard
              title="Ocurrió un problema temporal"
              description="No pudimos mostrar los usuarios. Inténtalo más tarde."
              actionLabel="Reintentar"
              onAction={users.retry}
              tone="error" variant="golden" icon={<AlertTriangle />}
              {...(users.error.correlationId ? { correlationId: users.error.correlationId } : {})}
            />
          ) : <>
          {users.error && items.length > 0 && (
            <InlineAlert
              variant="error"
              className="company-users__stale-notice"
              title="Ocurrió un problema temporal"
              message="No pudimos actualizar los usuarios. Los datos mostrados pueden no estar vigentes."
              {...(users.error.correlationId ? { correlationId: users.error.correlationId } : {})}
              action={{ label: "Reintentar", onClick: users.retry }}
            />
          )}
          {showResults && (
            <DataTableResultsHeader
              description={users.loading ? "Cargando usuarios" : `${users.result?.page.totalElements ?? 0} administradores y supervisores`}
              status={users.error && items.length > 0 ? "Actualización pendiente" : undefined}
            />
          )}
          {users.loading && items.length === 0 ? (
            <TableLoadingIndicator label="Cargando usuarios" variant="golden" columns={5} />
          ) : items.length === 0 ? (
            <AsyncStateCard
              title={
                users.search || users.role || users.status
                  ? "No encontramos coincidencias"
                  : "Aún no hay usuarios"
              }
              description={users.search || users.role || users.status ? "No encontramos usuarios que coincidan con los filtros seleccionados. Prueba con otros criterios o limpia los filtros." : "Invita a administradores o supervisores para comenzar a organizar los accesos del equipo."}
              actionLabel={
                users.search || users.role || users.status
                  ? "Limpiar búsqueda"
                  : users.canManage ? "Invitar administrador o supervisor" : undefined
              }
              onAction={
                users.search || users.role || users.status
                  ? users.clearFilters
                  : users.canManage ? () => users.setInviteOpen(true) : undefined
              }
              variant="golden"
              icon={users.search || users.role || users.status ? <Search /> : <Users />}
              actionIcon={users.search || users.role || users.status ? undefined : users.canManage ? <Plus aria-hidden="true" /> : undefined}
            />
          ) : (
            <CompanyUsersTable
              users={items}
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
            />
          )}
          {items.length > 0 && (
            <DataTablePagination
              page={users.result?.page.page ?? users.page}
              totalPages={users.result?.page.totalPages ?? 0}
              pageSize={users.pageSize}
              onPageChange={users.goToPage}
              onPageSizeChange={users.changePageSize}
              ariaLabel="Paginación de administradores y supervisores"
              summary={`Mostrando ${(users.result?.page.page ?? users.page) * users.pageSize + 1}–${Math.min(((users.result?.page.page ?? users.page) + 1) * users.pageSize, users.result?.page.totalElements ?? items.length)} de ${users.result?.page.totalElements ?? items.length} usuarios`}
              lastUpdated={users.lastUpdated}
              variant="golden"
            />
          )}
          </>}
        </DataTablePanel>
        {(users.inviteOpen || users.editingUser || users.resendingUser) && (
          <CompanyUserFormDrawer
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
              users.mutationError
                ? mutationErrorMessage(users.mutationError.status)
                : null
            }
            correlationId={users.mutationError?.correlationId}
            onClose={() => {
              users.setInviteOpen(false);
              users.setEditingUser(null);
              users.setResendingUser(null);
              users.setMutationError(null);
            }}
            onSubmit={saveUser}
          />
        )}
        {users.statusUser && (
          <CompanyUserStatusConfirmation
            user={users.statusUser}
            busy={users.submitting}
            error={users.mutationError}
            onClose={() => users.setStatusUser(null)}
            onConfirm={changeStatus}
            returnFocusTarget={
              users.menuTriggers.current[users.statusUser.id] ?? null
            }
          />
        )}
        {(details.loading || details.user !== null || details.error !== null) && (
          <CompanyUserDetailDrawer
            user={details.user}
            loading={details.loading}
            error={details.error}
            onRetry={details.retry}
            onClose={details.close}
          />
        )}
    </section>
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

function CompanyUserStatusConfirmation({
  user,
  busy,
  error,
  onClose,
  onConfirm,
  returnFocusTarget,
}: {
  user: CompanyUser;
  busy: boolean;
  error: ApiError | null;
  onClose: () => void;
  onConfirm: () => void;
  returnFocusTarget: HTMLButtonElement | null;
}) {
  const reactivate = user.status === "LOCKED" || user.status === "INACTIVE";
  const title = reactivate ? "Reactivar usuario" : "Bloquear usuario";
  const returnFocusRef = useRef<HTMLElement | null>(returnFocusTarget);
  const role = user.role === "COMPANY_ADMIN" ? "Administrador" : "Supervisor";
  return <ConfirmationDialog {...(reactivate ? { className: "confirmation-dialog--reactivate" } : {})} titleId="status-dialog-title" descriptionId="status-dialog-description" module="Usuarios" title={title} headerDescription="Confirma el cambio de acceso para este usuario." bodyTitle={reactivate ? `¿Reactivar a ${user.displayName}?` : `¿Bloquear a ${user.displayName}?`} message={reactivate ? `${user.displayName} recuperará el acceso correspondiente a su rol de ${role}.` : `${user.displayName} perderá acceso a la empresa mientras permanezca bloqueado.`} icon={reactivate ? <ArrowRight aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />} tone={reactivate ? "info" : "error"} {...(!reactivate ? { note: <><Shield aria-hidden="true" />Sus sesiones activas se revocarán cuando se confirme el bloqueo.</> } : {})} busy={busy} busyLabel={reactivate ? "Reactivando…" : "Bloqueando…"} error={error ? mutationErrorMessage(error.status) : null} errorTitle="No pudimos actualizar al usuario" correlationId={error?.correlationId} cancelLabel="Cancelar" confirmLabel={title} onCancel={onClose} onConfirm={onConfirm} returnFocusRef={returnFocusRef} />;
}
