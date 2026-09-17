import { MoreVertical, Pencil } from "lucide-react";
import { useState } from "react";
import { DataTable, DataTablePagination, DataTableStatus, type DataTableColumn } from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import { DataTableResultsHeader } from "../../../shared/ui/DataTableWorkspace";
import { TableLoadingIndicator } from "../../../shared/ui/TableLoadingIndicator";
import type { ApiError } from "../../../lib/api";
import type { Territory } from "../types";

type Props = { territories: readonly Territory[]; page: number; pageSize: DataTablePageSize; totalPages: number; totalElements: number; lastUpdated?: Date | null; canManage: boolean; loading: boolean; error: ApiError | null; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: DataTablePageSize) => void; onEdit: (territory: Territory) => void };

export function TerritoryTable({ territories, page, pageSize, totalPages, totalElements, lastUpdated, canManage, loading, error, onPageChange, onPageSizeChange, onEdit }: Props) {
  const [menuTerritory, setMenuTerritory] = useState<Territory | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const columns: DataTableColumn<Territory>[] = [
    { id: "name", header: "Zona", label: "Zona", width: "20%", render: (territory) => <strong className="territory-list__name">{territory.name}</strong> },
    { id: "code", header: "Código", label: "Código", width: "13%", render: (territory) => <span className="territory-list__code">{territory.code || "—"}</span> },
    { id: "description", header: "Descripción", label: "Descripción", width: "29%", render: (territory) => <span className="territory-list__description">{territory.description ?? "—"}</span> },
    { id: "status", header: "Estado", label: "Estado", width: "14%", render: (territory) => <DataTableStatus label={territory.status === "ACTIVE" ? "Activa" : "Inactiva"} tone={territory.status === "ACTIVE" ? "success" : "danger"} /> },
    { id: "sellers", header: "Vendedores", label: "Vendedores asignados", width: "15%", render: (territory) => <strong>{territory.assignedSellerCount}</strong> },
  ];
  if (canManage) columns.push({ id: "actions", header: "Acciones", label: "Acciones", width: "72px", align: "center", render: (territory) => <div className="territory-list__actions"><button className="data-table__icon-button data-table__icon-button--golden" type="button" aria-label={`Más acciones para ${territory.name}`} aria-expanded={menuTerritory?.id === territory.id} onClick={(event) => { if (menuTerritory?.id === territory.id) { setMenuTerritory(null); setMenuAnchor(null); } else { setMenuTerritory(territory); setMenuAnchor(event.currentTarget); } }}><MoreVertical aria-hidden="true" /></button>{menuTerritory?.id === territory.id ? <TableActionMenu variant="golden" anchor={menuAnchor} ariaLabel={`Acciones de ${territory.name}`} onDismiss={() => { setMenuTerritory(null); setMenuAnchor(null); }} items={[{ label: "Editar", icon: <Pencil aria-hidden="true" />, onSelect: () => { setMenuTerritory(null); setMenuAnchor(null); onEdit(territory); } }]} /> : null}</div> });
  const first = totalElements === 0 ? 0 : Math.min(page * pageSize + 1, totalElements);
  const last = Math.min((page + 1) * pageSize, totalElements);
  return <><DataTableResultsHeader description={`${totalElements} zonas`} status={loading ? <TableLoadingIndicator variant="golden" label="Actualizando zonas" compact /> : error ? <span role="status">Actualización pendiente</span> : undefined} /><DataTable responsive="cards" variant="golden" ariaLabel="Zonas" items={territories} rowKey={(territory) => territory.id} columns={columns} /><DataTablePagination variant="golden" page={page} totalPages={totalPages} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} ariaLabel="Paginación de zonas" summary={<>Mostrando {first}–{last} de {totalElements} zonas</>} lastUpdated={lastUpdated} /></>;
}
