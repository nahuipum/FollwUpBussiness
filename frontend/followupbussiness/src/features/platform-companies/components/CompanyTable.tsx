import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  EllipsisVertical,
  Eye,
  PauseCircle,
  PlayCircle,
  Search,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  onAction: (company: Company, action: "detail" | "suspend" | "reactivate") => void;
};

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
  const actionsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (openActionsFor === null) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !actionsRef.current?.contains(event.target)) {
        setOpenActionsFor(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [openActionsFor]);

  return (
    <section className="company-table-card" aria-busy={loading} ref={actionsRef}>
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
        <div className="company-filter-group" aria-label="Estado">
          <strong>Estado:</strong>
          <Filter
            label="Todas"
            active={status === null}
            onClick={() => onStatusChange(null)}
          />
          <Filter
            label="Activas"
            active={status === "ACTIVE"}
            onClick={() => onStatusChange("ACTIVE")}
          />
          <Filter
            label="Suspendidas"
            active={status === "SUSPENDED"}
            onClick={() => onStatusChange("SUSPENDED")}
          />
        </div>
      </div>
      {loading ? (
        <p className="company-empty" role="status">
          Cargando empresas…
        </p>
      ) : companies.length === 0 ? (
        <NoResults search={search} />
      ) : (
        <div className="company-table-wrap">
          <table className="company-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Código</th>
                <th>Zona horaria</th>
                <th>Estado</th>
                <th>Administradores</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td data-label="Empresa">
                    <div className="company-cell">
                      <span className="company-mark">
                        {company.code.slice(0, 2)}
                      </span>
                      <span className="company-copy">
                        <strong>{company.legalName}</strong>
                        {company.tradeName && (
                          <small>{company.tradeName}</small>
                        )}
                      </span>
                    </div>
                  </td>
                  <td data-label="Código">
                    <code>{company.code}</code>
                  </td>
                  <td data-label="Zona horaria">{company.timezone}</td>
                  <td data-label="Estado">
                    <span
                      className={`company-status company-status--${company.status === "ACTIVE" ? "active" : "suspended"}`}
                    >
                      {company.status === "ACTIVE" ? "Activa" : "Suspendida"}
                    </span>
                  </td>
                  <td data-label="Administradores">
                    <button
                      type="button"
                      className="company-more"
                      aria-label={`Gestionar administradores de ${company.legalName}`}
                      onClick={() => onProvision(company)}
                      disabled={company.status !== "ACTIVE"}
                    >
                      <UserPlus aria-hidden="true" />
                    </button>
                  </td>
                  <td data-label="Acciones">
                    {canManageStatuses ? (
                    <div className="company-row-actions">
                      <button type="button" className="company-more" aria-label={`Más acciones para ${company.legalName}`} aria-haspopup="menu" aria-expanded={openActionsFor === company.id} onClick={() => setOpenActionsFor((current) => current === company.id ? null : company.id)}>
                        <EllipsisVertical aria-hidden="true" />
                      </button>
                      {openActionsFor === company.id && <div className="company-action-menu" role="menu" aria-label={`Acciones de ${company.legalName}`}>
                        <ActionMenuItem icon={<Eye aria-hidden="true" />} label="Ver detalle" onSelect={() => { setOpenActionsFor(null); onAction(company, "detail"); }} />
                        {company.status === "ACTIVE" ? <ActionMenuItem icon={<PauseCircle aria-hidden="true" />} label="Suspender empresa" destructive onSelect={() => { setOpenActionsFor(null); onAction(company, "suspend"); }} /> : <ActionMenuItem icon={<PlayCircle aria-hidden="true" />} label="Reactivar empresa" onSelect={() => { setOpenActionsFor(null); onAction(company, "reactivate"); }} />}
                      </div>}
                    </div>
                    ) : <span>Sin permisos</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {page !== null && (
            <footer className="company-pagination">
              <span>
                Mostrando {companies.length} de {page.totalElements} empresas
              </span>
              <nav aria-label="Paginación de empresas">
                <button
                  type="button"
                  aria-label="Página anterior"
                  onClick={() => onPageChange(page.page - 1)}
                  disabled={page.page === 0}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-current="page"
                  aria-label={`Página ${page.page + 1}`}
                >
                  {page.page + 1}
                </button>
                <button
                  type="button"
                  aria-label="Página siguiente"
                  onClick={() => onPageChange(page.page + 1)}
                  disabled={page.page + 1 >= page.totalPages}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </nav>
            </footer>
          )}
        </div>
      )}
    </section>
  );
}

function ActionMenuItem({ icon, label, destructive = false, onSelect }: { icon: ReactNode; label: string; destructive?: boolean; onSelect: () => void }) {
  return <button type="button" role="menuitem" className={destructive ? "company-action-menu__danger" : undefined} onClick={onSelect}>{icon}<span><strong>{label}</strong></span></button>;
}

function Filter({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`company-filter-chip${active ? " company-filter-chip--active" : ""}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
function NoResults({ search }: { search: string }) {
  return (
    <section className="company-empty">
      <Clock3 aria-hidden="true" />
      <h2>
        {search ? "No encontramos empresas" : "Aún no hay empresas creadas"}
      </h2>
      <p>
        {search
          ? `No hay resultados para “${search}”.`
          : "Crea la primera empresa para comenzar su onboarding."}
      </p>
    </section>
  );
}
