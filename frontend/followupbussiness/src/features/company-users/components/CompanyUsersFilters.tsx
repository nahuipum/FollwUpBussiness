import { DataTableToolbar, SearchField } from "../../../shared/ui/DataTableWorkspace";
import { FilterField } from "../../../shared/ui/FilterField";
import { VisualSelect } from "../../../shared/ui/VisualSelect";

type Props<T extends string> = {
  label: string;
  values: readonly T[];
  selected: T;
  onChange: (value: T) => void;
};

function Filter<T extends string>({
  label,
  values,
  selected,
  onChange,
}: Props<T>) {
  return (
    <FilterField label={label}>
      <VisualSelect
        variant="golden"
        ariaLabel={label}
        value={selected}
        options={values.map((value) => ({ value, label: value }))}
        onChange={onChange}
      />
    </FilterField>
  );
}

export function CompanyUsersFilters({
  query,
  role,
  status,
  onQueryChange,
  onRoleChange,
  onStatusChange,
}: {
  query: string;
  role: "COMPANY_ADMIN" | "SUPERVISOR" | null;
  status: "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED" | null;
  onQueryChange: (value: string) => void;
  onRoleChange: (value: "COMPANY_ADMIN" | "SUPERVISOR" | null) => void;
  onStatusChange: (
    value: "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED" | null,
  ) => void;
}) {
  return (
    <DataTableToolbar filterCount={2}>
      <SearchField
        id="company-user-search"
        label="Buscar por nombre o correo"
        value={query}
        onChange={onQueryChange}
        placeholder="Nombre o correo"
      />
      <Filter
        label="Rol"
        values={["Todos", "Administrador", "Supervisor"]}
        selected={
          role === "COMPANY_ADMIN"
            ? "Administrador"
            : role === "SUPERVISOR"
              ? "Supervisor"
              : "Todos"
        }
        onChange={(value) =>
          onRoleChange(
            value === "Administrador"
              ? "COMPANY_ADMIN"
              : value === "Supervisor"
                ? "SUPERVISOR"
                : null,
          )
        }
      />
      <Filter
        label="Estado"
        values={[
          "Todos",
          "Invitación pendiente",
          "Activo",
          "Inactivo",
          "Bloqueado",
        ]}
        selected={
          status === "INVITED"
            ? "Invitación pendiente"
            : status === "ACTIVE"
              ? "Activo"
              : status === "INACTIVE"
                ? "Inactivo"
                : status === "LOCKED"
                  ? "Bloqueado"
                  : "Todos"
        }
        onChange={(value) =>
          onStatusChange(
            value === "Invitación pendiente"
              ? "INVITED"
              : value === "Activo"
                ? "ACTIVE"
                : value === "Inactivo"
                  ? "INACTIVE"
                  : value === "Bloqueado"
                    ? "LOCKED"
                    : null,
          )
        }
      />
    </DataTableToolbar>
  );
}
