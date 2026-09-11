import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { dataTablePageSizes, type DataTablePageSize } from "./data-table-pagination";
import { VisualSelect } from "./VisualSelect";
import "./data-table.css";

export type DataTableColumn<T> = Readonly<{
  id: string;
  header: ReactNode;
  label: string;
  render: (item: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}>;

export function DataTable<T>({
  ariaLabel,
  items,
  columns,
  rowKey,
  responsive = "scroll",
  variant = "default",
}: {
  ariaLabel: string;
  items: readonly T[];
  columns: readonly DataTableColumn<T>[];
  rowKey: (item: T) => string;
  responsive?: "scroll" | "cards";
  variant?: "default" | "golden";
}) {
  return (
    <div className={`data-table__wrap data-table__wrap--${responsive}`}>
      <table className={`data-table data-table--${responsive} data-table--${variant}`} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={alignClass(column.align)}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={rowKey(item)}>
              {columns.map((column) => (
                <td
                  key={column.id}
                  data-label={column.label}
                  className={alignClass(column.align)}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataTablePagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  ariaLabel,
  summary,
  lastUpdated,
  variant = "default",
}: {
  page: number;
  totalPages: number;
  pageSize: DataTablePageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: DataTablePageSize) => void;
  ariaLabel: string;
  summary?: ReactNode;
  lastUpdated?: Date | null | undefined;
  variant?: "default" | "golden";
}) {
  if (totalPages < 1) return null;
  const lastPage = totalPages - 1;
  const pages = paginationPages(page, lastPage);
  return (
    <footer className={`data-table__pagination data-table__pagination--${variant}`}>
      {(summary || lastUpdated) && (
        <div className="data-table__metadata">
          {summary && <span className="data-table__summary">{summary}</span>}
          {lastUpdated && (
            <time className="data-table__last-updated" dateTime={lastUpdated.toISOString()} role="status">
              Actualizado hoy, {formatTime(lastUpdated)}
            </time>
          )}
        </div>
      )}
      <label className="data-table__page-size">
        <span>Registros por página</span>
        <VisualSelect
          variant={variant}
          ariaLabel="Registros por página"
          value={String(pageSize)}
          options={dataTablePageSizes.map((size) => ({ value: String(size), label: String(size) }))}
          onChange={(value) => onPageSizeChange(Number(value) as DataTablePageSize)}
        />
      </label>
      <nav aria-label={ariaLabel}>
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        {pages.map((item, index) => item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="data-table__ellipsis" aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            aria-label={`Página ${item + 1}`}
            onClick={item === page ? undefined : () => onPageChange(item)}
          >
            {item + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Página siguiente"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </nav>
    </footer>
  );
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function paginationPages(page: number, lastPage: number): Array<number | "ellipsis"> {
  if (lastPage === 0) return [0];
  if (page === 0) return [0, "ellipsis", lastPage];
  if (page === lastPage) return [0, "ellipsis", lastPage];

  return [
    0,
    ...(page > 1 ? ["ellipsis" as const] : []),
    page,
    ...(page < lastPage - 1 ? ["ellipsis" as const] : []),
    lastPage,
  ];
}

export function DataTableStatus({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <span className={`data-table__status data-table__status--${tone}`}>
      <span>{label}</span>
    </span>
  );
}

export function DataTableIdentity({
  mark,
  primary,
  secondary,
}: {
  mark: ReactNode;
  primary: string;
  secondary?: string | undefined;
}) {
  return (
    <div className="data-table__identity">
      <span className="data-table__identity-mark">{mark}</span>
      <span>
        <strong>{primary}</strong>
        {secondary && <small>{secondary}</small>}
      </span>
    </div>
  );
}

function alignClass(align: DataTableColumn<unknown>["align"]) {
  return align ? `data-table__cell--${align}` : undefined;
}
