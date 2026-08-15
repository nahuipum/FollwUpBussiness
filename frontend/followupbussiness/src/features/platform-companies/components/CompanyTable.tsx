import {
  Clock3,
  EllipsisVertical,
  Eye,
  PauseCircle,
  PlayCircle,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  DataTableIdentity,
  DataTablePagination,
  DataTableStatus,
  type DataTableColumn,
} from "../../../shared/ui/DataTable";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { Company, CompanyPage, CompanyStatus } from "../types";

type Props = {
  companies: readonly Company[];
  page: CompanyPage["page"] | null;
  search: string;
  status: CompanyStatus | null;
  loading: boolean;
  canManageStatuses: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CompanyStatus | null) => void;
  onPageChange: (page: number) => void;
  onProvision: (company: Company) => void;
  onAction: (
    company: Company,
    action: "detail" | "suspend" | "reactivate",
  ) => void;
};

type CompanyStatusFilter = "ALL" | CompanyStatus;

export function CompanyTable({
  companies,
  page,
  search,
  status,
  loading,
  canManageStatuses,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onProvision,
  onAction,
}: Props) {
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const [actionAnchor, setActionAnchor] = useState<HTMLButtonElement | null>(null);
  const selectedStatus: CompanyStatusFilter = status ?? "ALL";
  const closeActions = () => {
    setOpenActionsFor(null);
    setActionAnchor(null);
  };
  const toggleActions = (companyId: string, anchor: HTMLButtonElement) => {
    const next = openActionsFor === companyId ? null : companyId;
    setOpenActionsFor(next);
    setActionAnchor(next === null ? null : anchor);
  };

  return (
    <section className="company-table-card" aria-busy={loading}>
      <div className="company-toolbar">
        <label className="company-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar empresa o código"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar empresa o código"
          />
        </label>
        <div className="filter-field filter-field--inline">
          <span>Estado:</span>
          <VisualSelect
            ariaLabel="Filtrar empresas por estado"
            value={selectedStatus}
            options={[
              { value: "ALL", label: "Todas" },
              { value: "ACTIVE", label: "Activas" },
              { value: "SUSPENDED", label: "Suspendidas" },
            ]}
            onChange={(value) =>
              onStatusChange(value === "ALL" ? null : value)
            }
          />
        </div>
      </div>
      {loading ? (
        <p className="company-empty" role="status">Cargando empresas…</p>
      ) : companies.length === 0 ? (
        <NoResults search={search} />
      ) : (
        <>
          <DataTable
            ariaLabel="Empresas"
            items={companies}
            rowKey={(company) => company.id}
            columns={companyColumns({
              canManageStatuses,
              openActionsFor,
              actionAnchor,
              onProvision,
              onAction,
              toggleActions,
              closeActions,
            })}
          />
          {page && (
            <DataTablePagination
              page={page.page}
              totalPages={page.totalPages}
              onPageChange={onPageChange}
              ariaLabel="Paginación de empresas"
              summary={<>Mostrando {companies.length} de {page.totalElements} empresas</>}
            />
          )}
        </>
      )}
    </section>
  );
}

function companyColumns({
  canManageStatuses,
  openActionsFor,
  actionAnchor,
  onProvision,
  onAction,
  toggleActions,
  closeActions,
}: {
  canManageStatuses: boolean;
  openActionsFor: string | null;
  actionAnchor: HTMLButtonElement | null;
  onProvision: Props["onProvision"];
  onAction: Props["onAction"];
  toggleActions: (companyId: string, anchor: HTMLButtonElement) => void;
  closeActions: () => void;
}): readonly DataTableColumn<Company>[] {
  return [
    {
      id: "company",
      header: "Empresa",
      label: "Empresa",
      width: "28%",
      render: (company) => (
        <DataTableIdentity
          mark={company.code.slice(0, 2)}
          primary={company.legalName}
          secondary={company.tradeName ?? undefined}
        />
      ),
    },
    {
      id: "code",
      header: "Código",
      label: "Código",
      width: "13%",
      render: (company) => <code>{company.code}</code>,
    },
    {
      id: "timezone",
      header: "Zona horaria",
      label: "Zona horaria",
      width: "16%",
      render: (company) => company.timezone,
    },
    {
      id: "status",
      header: "Estado",
      label: "Estado",
      width: "14%",
      render: (company) => (
        <DataTableStatus
          label={company.status === "ACTIVE" ? "Activa" : "Suspendida"}
          tone={company.status === "ACTIVE" ? "success" : "danger"}
        />
      ),
    },
    {
      id: "admins",
      header: "Administradores",
      label: "Administradores",
      width: "17%",
      align: "center",
      render: (company) => (
        <button
          type="button"
          className="data-table__icon-button"
          aria-label={`Gestionar administradores de ${company.legalName}`}
          onClick={() => onProvision(company)}
          disabled={company.status !== "ACTIVE"}
        >
          <UserPlus aria-hidden="true" />
        </button>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      label: "Acciones",
      width: "12%",
      align: "center",
      render: (company) =>
        canManageStatuses ? (
          <div className="company-row-actions">
            <button
              type="button"
              className="data-table__icon-button"
              aria-label={`Más acciones para ${company.legalName}`}
              aria-haspopup="menu"
              aria-expanded={openActionsFor === company.id}
              onClick={(event) => toggleActions(company.id, event.currentTarget)}
            >
              <EllipsisVertical aria-hidden="true" />
            </button>
            {openActionsFor === company.id && (
              <TableActionMenu
                anchor={actionAnchor}
                ariaLabel={`Acciones de ${company.legalName}`}
                onDismiss={closeActions}
                items={[
                  {
                    label: "Ver detalle",
                    icon: <Eye aria-hidden="true" />,
                    onSelect: () => {
                      closeActions();
                      onAction(company, "detail");
                    },
                  },
                  company.status === "ACTIVE"
                    ? {
                        label: "Suspender empresa",
                        icon: <PauseCircle aria-hidden="true" />,
                        tone: "danger",
                        onSelect: () => {
                          closeActions();
                          onAction(company, "suspend");
                        },
                      }
                    : {
                        label: "Reactivar empresa",
                        icon: <PlayCircle aria-hidden="true" />,
                        onSelect: () => {
                          closeActions();
                          onAction(company, "reactivate");
                        },
                      },
                ]}
              />
            )}
          </div>
        ) : (
          <span>Sin permisos</span>
        ),
    },
  ];
}

function NoResults({ search }: { search: string }) {
  return (
    <section className="company-empty">
      <Clock3 aria-hidden="true" />
      <h2>{search ? "No encontramos empresas" : "Aún no hay empresas creadas"}</h2>
      <p>
        {search
          ? `No hay resultados para “${search}”.`
          : "Crea la primera empresa para comenzar su onboarding."}
      </p>
    </section>
  );
}
