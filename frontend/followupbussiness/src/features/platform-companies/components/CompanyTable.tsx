import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  UserPlus,
} from "lucide-react";
import type { Company, CompanyPage, CompanyStatus } from "../types";

type Props = {
  companies: readonly Company[];
  page: CompanyPage["page"] | null;
  search: string;
  status: CompanyStatus | null;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CompanyStatus | null) => void;
  onPageChange: (page: number) => void;
  onProvision: (company: Company) => void;
};

export function CompanyTable({
  companies,
  page,
  search,
  status,
  loading,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onProvision,
}: Props) {
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
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
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
                  <td data-label="Acciones">
                    <button
                      type="button"
                      className="company-more"
                      aria-label={`Provisionar administrador para ${company.legalName}`}
                      onClick={() => onProvision(company)}
                      disabled={company.status !== "ACTIVE"}
                    >
                      <UserPlus aria-hidden="true" />
                    </button>
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
