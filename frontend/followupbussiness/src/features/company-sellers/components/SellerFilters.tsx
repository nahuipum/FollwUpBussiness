import { Search } from "lucide-react";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { SellerStatus } from "../types";

type FilterOption = Readonly<{ id: string; label: string }>;

export function SellerFilters({
  query,
  status,
  supervisorId,
  territoryId,
  supervisors,
  territories,
  onQueryChange,
  onStatusChange,
  onSupervisorChange,
  onTerritoryChange,
}: {
  query: string;
  status: SellerStatus | null;
  supervisorId: string | null;
  territoryId: string | null;
  supervisors: readonly FilterOption[];
  territories: readonly FilterOption[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: SellerStatus | null) => void;
  onSupervisorChange: (value: string | null) => void;
  onTerritoryChange: (value: string | null) => void;
}) {
  return (
    <div className="seller-list__toolbar">
      <div className="seller-list__search-field">
        <label htmlFor="seller-search">Buscar por nombre, correo o código</label>
        <div className="seller-list__search">
          <Search aria-hidden="true" />
          <input
            id="seller-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nombre, correo o código"
          />
        </div>
      </div>
      <div className="filter-field">
        <span>Supervisor</span>
        <VisualSelect
          variant="golden"
          ariaLabel="Supervisor"
          value={supervisorId ?? "ALL"}
          options={[
            { value: "ALL", label: "Todos" },
            ...supervisors.map(({ id, label }) => ({ value: id, label })),
          ]}
          onChange={(value) =>
            onSupervisorChange(value === "ALL" ? null : value)
          }
        />
      </div>
      <div className="filter-field">
        <span>Zona/territorio</span>
        <VisualSelect
          variant="golden"
          ariaLabel="Zona / territorio"
          value={territoryId ?? "ALL"}
          options={[
            { value: "ALL", label: "Todos" },
            ...territories.map(({ id, label }) => ({ value: id, label })),
          ]}
          onChange={(value) =>
            onTerritoryChange(value === "ALL" ? null : value)
          }
        />
      </div>
      <div className="filter-field">
        <span>Estado</span>
        <VisualSelect
          variant="golden"
          ariaLabel="Estado"
          value={status ?? "ALL"}
          options={[
            { value: "ALL", label: "Todos" },
            { value: "INVITED", label: "Pendiente de invitación" },
            { value: "ACTIVE", label: "Activo" },
            { value: "INACTIVE", label: "Inactivo" },
          ]}
          onChange={(value) =>
            onStatusChange(value === "ALL" ? null : (value as SellerStatus))
          }
        />
      </div>
    </div>
  );
}
