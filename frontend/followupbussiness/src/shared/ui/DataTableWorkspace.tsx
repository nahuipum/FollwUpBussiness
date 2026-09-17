import { Search } from "lucide-react";
import type { ChangeEventHandler, CSSProperties, ReactNode } from "react";
import "./data-table-workspace.css";

export function DataTablePanel({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <section
      className="data-table-panel"
      aria-label={ariaLabel}
      data-ui="data-table-panel"
    >
      {children}
    </section>
  );
}

export function DataTableToolbar({
  filterCount,
  layout = "standard",
  children,
}: {
  filterCount: number;
  layout?: "standard" | "wide-search";
  children: ReactNode;
}) {
  const dense = filterCount > 3;
  return (
    <div
      className={`data-table-toolbar data-table-toolbar--${dense ? "dense" : `${filterCount}-filters`}${layout === "wide-search" ? " data-table-toolbar--wide-search" : ""}`}
      data-ui="data-table-toolbar"
      data-filter-count={filterCount}
      style={dense ? ({ "--data-table-filter-count": filterCount } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export function SearchField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    onChange(event.target.value);

  return (
    <label className="data-table-search-field" htmlFor={id} data-ui="search-field">
      <span>{label}</span>
      <span className="data-table-search-field__control">
        <Search aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          disabled={disabled}
        />
      </span>
    </label>
  );
}

export function DataTableResultsHeader({
  description,
  status,
}: {
  description: ReactNode;
  status?: ReactNode;
}) {
  return (
    <header
      className="data-table-results-header"
      aria-live="polite"
      data-ui="data-table-results-header"
    >
      <div>
        <strong>Resultados</strong>
        <span>{description}</span>
      </div>
      {status && (
        <div className="data-table-results-header__status">{status}</div>
      )}
    </header>
  );
}
