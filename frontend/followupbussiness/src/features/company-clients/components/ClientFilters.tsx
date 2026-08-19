import { Search } from "lucide-react";
import { DateFilterField } from "../../../shared/ui/DateFilterField";
import { FilterField } from "../../../shared/ui/FilterField";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { ClientFilterOptions, ClientStatus } from "../types";

type Props = {
  query: string;
  status: ClientStatus | null;
  territoryId: string | null;
  sellerId: string | null;
  withoutVisitSince: string;
  withoutPurchaseSince: string;
  options: ClientFilterOptions;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: ClientStatus | null) => void;
  onTerritoryChange: (value: string | null) => void;
  onSellerChange: (value: string | null) => void;
  onWithoutVisitSinceChange: (value: string) => void;
  onWithoutPurchaseSinceChange: (value: string) => void;
};

export function ClientFilters({
  query,
  status,
  territoryId,
  sellerId,
  withoutVisitSince,
  withoutPurchaseSince,
  options,
  onQueryChange,
  onStatusChange,
  onTerritoryChange,
  onSellerChange,
  onWithoutVisitSinceChange,
  onWithoutPurchaseSinceChange,
}: Props) {
  return (
    <div className="client-list__toolbar">
      <label className="client-list__search">
        <Search aria-hidden="true" />
        <span className="sr-only">Buscar cliente por nombre o segmento</span>
        <input
          aria-label="Buscar cliente por nombre o segmento"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar por nombre o segmento"
        />
      </label>
      <FilterField label="Zona">
        <VisualSelect
          ariaLabel="Zona"
          value={territoryId ?? "ALL"}
          options={[
            { value: "ALL", label: "Todas" },
            ...options.territories.map((option) => ({
              value: option.id,
              label: option.label,
            })),
          ]}
          onChange={(value) =>
            onTerritoryChange(value === "ALL" ? null : value)
          }
        />
      </FilterField>
      <FilterField label="Vendedor">
        <VisualSelect
          ariaLabel="Vendedor"
          value={sellerId ?? "ALL"}
          options={[
            { value: "ALL", label: "Todos" },
            ...options.sellers.map((option) => ({
              value: option.id,
              label: option.label,
            })),
          ]}
          onChange={(value) =>
            onSellerChange(value === "ALL" ? null : value)
          }
        />
      </FilterField>
      <FilterField label="Estado">
        <VisualSelect
          ariaLabel="Estado"
          value={status ?? "ALL"}
          options={[
            { value: "ALL", label: "Todos" },
            { value: "ACTIVE", label: "Activo" },
            { value: "INACTIVE", label: "Inactivo" },
          ]}
          onChange={(value) =>
            onStatusChange(
              value === "ALL" ? null : (value as ClientStatus),
            )
          }
        />
      </FilterField>
      <DateFilterField
        label="Sin visita desde"
        value={withoutVisitSince}
        onValueChange={onWithoutVisitSinceChange}
      />
      <DateFilterField
        label="Sin compra desde"
        value={withoutPurchaseSince}
        onValueChange={onWithoutPurchaseSinceChange}
      />
    </div>
  );
}
