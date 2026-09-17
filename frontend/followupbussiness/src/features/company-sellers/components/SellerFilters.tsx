import { DataTableToolbar, SearchField } from "../../../shared/ui/DataTableWorkspace";
import { FilterField } from "../../../shared/ui/FilterField";
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
    <DataTableToolbar filterCount={3}>
      <SearchField
        id="seller-search"
        label="Buscar por nombre, correo o código"
        value={query}
        onChange={onQueryChange}
        placeholder="Nombre, correo o código"
      />
      <FilterField label="Supervisor">
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
      </FilterField>
      <FilterField label="Zona/territorio">
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
      </FilterField>
      <FilterField label="Estado">
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
      </FilterField>
    </DataTableToolbar>
  );
}
