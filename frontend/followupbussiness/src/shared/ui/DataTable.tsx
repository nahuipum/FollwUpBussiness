import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import "./data-table.css";

export type DataTableColumn<T> = Readonly<{ id: string; header: ReactNode; label: string; render: (item: T) => ReactNode; width?: string; align?: "left" | "center" | "right" }>;

export function DataTable<T>({ ariaLabel, items, columns, rowKey }: { ariaLabel: string; items: readonly T[]; columns: readonly DataTableColumn<T>[]; rowKey: (item: T) => string }) {
  return <div className="data-table__wrap"><table className="data-table" aria-label={ariaLabel}><thead><tr>{columns.map((column) => <th key={column.id} scope="col" className={alignClass(column.align)} style={column.width ? { width: column.width } : undefined}>{column.header}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={rowKey(item)}>{columns.map((column) => <td key={column.id} data-label={column.label} className={alignClass(column.align)}>{column.render(item)}</td>)}</tr>)}</tbody></table></div>;
}

export function DataTablePagination({ page, totalPages, onPageChange, ariaLabel, summary }: { page: number; totalPages: number; onPageChange: (page: number) => void; ariaLabel: string; summary?: ReactNode }) {
  if (totalPages < 1) return null;
  return <footer className="data-table__pagination">{summary && <span>{summary}</span>}<nav aria-label={ariaLabel}><button type="button" aria-label="Página anterior" onClick={() => onPageChange(page - 1)} disabled={page === 0}><ChevronLeft aria-hidden="true" /></button><button type="button" aria-current="page" aria-label={`Página ${page + 1}`}>{page + 1}</button><button type="button" aria-label="Página siguiente" onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages}><ChevronRight aria-hidden="true" /></button></nav></footer>;
}

export function DataTableStatus({ label, tone }: { label: string; tone: "success" | "warning" | "danger" }) {
  return <span className={`data-table__status data-table__status--${tone}`}>{label}</span>;
}

export function DataTableIdentity({ mark, primary, secondary }: { mark: ReactNode; primary: string; secondary?: string | undefined }) {
  return <div className="data-table__identity"><span className="data-table__identity-mark">{mark}</span><span><strong>{primary}</strong>{secondary && <small>{secondary}</small>}</span></div>;
}

function alignClass(align: DataTableColumn<unknown>["align"]) { return align ? `data-table__cell--${align}` : undefined; }
