import { Search } from "lucide-react";
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
    <div className="filter-field">
      <span>{label}</span>
      <VisualSelect
        variant="golden"
        ariaLabel={label}
        value={selected}
        options={values.map((value) => ({ value, label: value }))}
        onChange={onChange}
      />
    </div>
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
    <div className="company-users__toolbar">
      <label className="company-users__search">
        <span>Buscar por nombre o correo</span>
        <div className="company-users__search-control"><Search aria-hidden="true" /><input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nombre o correo"
        /></div>
      </label>
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
    </div>
  );
}
