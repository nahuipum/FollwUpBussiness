import { DateFilterField } from "../../../shared/ui/DateFilterField";
import { FilterField } from "../../../shared/ui/FilterField";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { RouteSellerOption, RouteStatus } from "../types";

const statuses: readonly { value: RouteStatus; label: string }[] = [
  { value: "DRAFT", label: "Borrador" }, { value: "PUBLISHED", label: "Publicada" }, { value: "IN_PROGRESS", label: "En curso" }, { value: "COMPLETED", label: "Completada" }, { value: "CANCELLED", label: "Cancelada" },
];
export function RouteFilters({ date, sellerId, status, sellers, onDateChange, onSellerChange, onStatusChange }: { date: string; sellerId: string | null; status: RouteStatus | null; sellers: readonly RouteSellerOption[]; onDateChange: (value: string) => void; onSellerChange: (value: string | null) => void; onStatusChange: (value: RouteStatus | null) => void }) {
  return <div className="route-list__toolbar">
    <DateFilterField label="Fecha" value={date} onValueChange={onDateChange} />
    <FilterField label="Vendedor"><VisualSelect ariaLabel="Vendedor" value={sellerId ?? "ALL"} options={[{ value: "ALL", label: "Todos" }, ...sellers.map((seller) => ({ value: seller.id, label: seller.label }))]} onChange={(value) => onSellerChange(value === "ALL" ? null : value)} /></FilterField>
    <FilterField label="Estado"><VisualSelect ariaLabel="Estado" value={status ?? "ALL"} options={[{ value: "ALL", label: "Todos" }, ...statuses]} onChange={(value) => onStatusChange(value === "ALL" ? null : value as RouteStatus)} /></FilterField>
  </div>;
}
