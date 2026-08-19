import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSessionIdentity, subscribeToSession } from "../auth/auth";
import { SellerDetailDialog } from "./components/SellerDetailDialog";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { SellerFilters } from "./components/SellerFilters";
import { SellerTable } from "./components/SellerTable";
import { sellerSessionKey, useSellers } from "./hooks/useSellers";
import { useSellerForm } from "./hooks/useSellerForm";
import { useSellerStatus } from "./hooks/useSellerStatus";
import { useSellerAssignment } from "./hooks/useSellerAssignment";
import type { Seller } from "./types";
import { SellerFormDialog } from "./components/SellerFormDialog";
import { ReadOnlyNotice } from "../../shared/ui/ReadOnlyNotice";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { SellerStatusDialog } from "./components/SellerStatusDialog";
import { SellerAssignmentDialog } from "./components/SellerAssignmentDialog";
import { SellerOperationDialog } from "./components/SellerOperationDialog";
import "./styles/company-sellers.css";

export function CompanySellersPage() {
  const canManage =
    getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;
  const sellers = useSellers();
  const form = useSellerForm(sellers.retry);
  const statusChange = useSellerStatus(sellers.sessionKey, sellers.replaceSeller);
  const assignment = useSellerAssignment(sellers.sessionKey, sellers.retry);
  const items = sellers.result?.items ?? [];
  const [detail, setDetail] = useState<Seller | null>(null);
  const sessionKeyRef = useRef(sellers.sessionKey);

  useEffect(
    () =>
      subscribeToSession(() => {
        const nextKey = sellerSessionKey();
        if (sessionKeyRef.current === nextKey) return;
        sessionKeyRef.current = nextKey;
        setDetail(null);
      }),
    [],
  );

  return (
    <section className="seller-list" aria-labelledby="seller-list-title">
      <header className="seller-list__heading">
        <div>
          <h1 id="seller-list-title">Vendedores</h1>
          <p>Consulta y organiza el equipo comercial de la empresa.</p>
        </div>
        {canManage && (
          <button
            className="seller-list__primary"
            type="button"
            onClick={() => form.open(null)}
          >
            <Plus aria-hidden="true" />
            Crear vendedor
          </button>
        )}
      </header>
      <section className="seller-list__card" aria-label="Listado de vendedores">
        <SellerFilters
          query={sellers.search}
          status={sellers.status}
          supervisorId={sellers.supervisorId}
          territoryId={sellers.territoryId}
          supervisors={sellers.filterOptions.supervisors}
          territories={sellers.filterOptions.territories}
          onQueryChange={sellers.changeSearch}
          onStatusChange={sellers.changeStatus}
          onSupervisorChange={sellers.changeSupervisor}
          onTerritoryChange={sellers.changeTerritory}
        />
        {!canManage && <ReadOnlyNotice />}
        {sellers.error && (
          <AsyncStateCard
            tone="error"
            title={
              sellers.error.status === 403
                ? "No tienes permisos"
                : "Ocurrió un problema temporal"
            }
            description={
              sellers.error.status === 403
                ? "No tienes permiso para consultar vendedores."
                : "No pudimos mostrar los vendedores. Inténtalo más tarde."
            }
            actionLabel="Reintentar"
            onAction={sellers.retry}
          />
        )}
        {sellers.loading && items.length === 0 ? (
          <TableLoadingIndicator label="Cargando vendedores" />
        ) : !sellers.error && items.length === 0 ? (
          <AsyncStateCard
            title={
              sellers.search ||
              sellers.status ||
              sellers.supervisorId ||
              sellers.territoryId
                ? "No encontramos vendedores"
                : "Aún no hay vendedores"
            }
            description={
              sellers.search ||
              sellers.status ||
              sellers.supervisorId ||
              sellers.territoryId
                ? "Prueba con otros filtros o términos de búsqueda."
                : "Cuando existan vendedores aparecerán en este listado."
            }
            {...(sellers.search ||
            sellers.status ||
            sellers.supervisorId ||
            sellers.territoryId
              ? {
                  actionLabel: "Limpiar filtros",
                  onAction: sellers.clearFilters,
                }
              : {})}
          />
        ) : (
          !sellers.error && (
            <>
              <SellerTable
                sellers={items}
                page={sellers.page}
                totalPages={sellers.result?.page.totalPages ?? 0}
                totalElements={
                  sellers.result?.page.totalElements ?? items.length
                }
                canManage={canManage}
                onPageChange={sellers.goToPage}
                onDetail={setDetail}
                onEdit={form.open}
                onAssign={assignment.open}
                onChangeStatus={statusChange.open}
              />
              {sellers.loading && (
                <div className="seller-list__stale">
                  <TableLoadingIndicator
                    label="Actualizando vendedores"
                    compact
                  />
                </div>
              )}
            </>
          )
        )}
      </section>
      {detail && (
        <SellerDetailDialog seller={detail} onClose={() => setDetail(null)} />
      )}
      {form.seller !== undefined && (
        <SellerFormDialog
          seller={form.seller}
          options={form.options}
          loadingOptions={form.loadingOptions}
          busy={form.busy}
          error={form.error}
          onClose={form.close}
          onRetryOptions={form.loadOptions}
          onSubmit={form.submit}
        />
      )}
      {canManage && statusChange.seller && (
        <SellerStatusDialog
          seller={statusChange.seller}
          reason={statusChange.reason}
          busy={statusChange.busy}
          error={statusChange.error}
          onReasonChange={statusChange.setReason}
          onClose={statusChange.close}
          onConfirm={statusChange.submit}
        />
      )}
      {canManage && assignment.seller && assignment.kind && (
        <SellerAssignmentDialog
          seller={assignment.seller}
          kind={assignment.kind}
          options={assignment.options}
          loading={assignment.loading}
          busy={assignment.busy}
          error={assignment.error ? "No pudimos guardar la asignación. Inténtalo nuevamente." : null}
          onClose={assignment.close}
          onRetry={assignment.load}
          onSubmit={assignment.submit}
        />
      )}
      {form.notice && (
        <SellerOperationDialog
          tone={form.notice.tone}
          message={form.notice.message}
          onClose={form.closeNotice}
        />
      )}
    </section>
  );
}
