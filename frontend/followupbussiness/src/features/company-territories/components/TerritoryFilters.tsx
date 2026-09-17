import { FilterField } from "../../../shared/ui/FilterField";
import { DataTableToolbar, SearchField } from "../../../shared/ui/DataTableWorkspace";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { TerritoryStatus } from "../types";

export function TerritoryFilters({ search, status, onSearchChange, onStatusChange }: {
  search: string;
  status: TerritoryStatus | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TerritoryStatus | null) => void;
}) {
  return <DataTableToolbar filterCount={1} layout="wide-search">
    <SearchField id="territory-search" label="Buscar" value={search} onChange={onSearchChange} placeholder="Buscar por nombre o código" />
    <FilterField label="Estado"><VisualSelect variant="golden" ariaLabel="Estado" value={status ?? "ALL"} options={[{ value: "ALL", label: "Todos" }, { value: "ACTIVE", label: "Activas" }, { value: "INACTIVE", label: "Inactivas" }]} onChange={(value) => onStatusChange(value === "ALL" ? null : value as TerritoryStatus)} /></FilterField>
  </DataTableToolbar>;
}
