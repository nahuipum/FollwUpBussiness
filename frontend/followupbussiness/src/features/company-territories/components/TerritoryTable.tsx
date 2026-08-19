import { MoreVertical, Pencil } from "lucide-react";
import { useState } from "react";
import { DataTable, DataTablePagination, DataTableStatus, type DataTableColumn } from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import type { Territory } from "../types";

type Props = { territories: readonly Territory[]; page: number; pageSize: DataTablePageSize; totalPages: number; totalElements: number; canManage: boolean; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: DataTablePageSize) => void; onEdit: (territory: Territory) => void };

export function TerritoryTable({ territories, page, pageSize, totalPages, totalElements, canManage, onPageChange, onPageSizeChange, onEdit }: Props) {
  const [menuTerritory, setMenuTerritory] = useState<Territory | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const columns: DataTableColumn<Territory>[] = [
    { id: "name", header: "Zona", label: "Zona", width: "25%", render: (territory) => territory.name },
    { id: "code", header: "Código", label: "Código", width: "15%", render: (territory) => territory.code || "—" },
    { id: "description", header: "Descripción", label: "Descripción", width: "25%", render: (territory) => territory.description ?? "—" },
    { id: "status", header: "Estado", label: "Estado", width: "14%", render: (territory) => <DataTableStatus label={territory.status === "ACTIVE" ? "Activa" : "Inactiva"} tone={territory.status === "ACTIVE" ? "success" : "warning"} /> },
    { id: "sellers", header: "Vendedores", label: "Vendedores asignados", width: "12%", render: (territory) => territory.assignedSellerCount },
  ];
  if (canManage) columns.push({ id: "actions", header: "Acciones", label: "Acciones", width: "9%", align: "center", render: (territory) => <div className="territory-list__actions"><button className="data-table__icon-button" type="button" aria-label={`Más acciones para ${territory.name}`} aria-expanded={menuTerritory?.id === territory.id} onClick={(event) => { if (menuTerritory?.id === territory.id) { setMenuTerritory(null); setMenuAnchor(null); } else { setMenuTerritory(territory); setMenuAnchor(event.currentTarget); } }}><MoreVertical aria-hidden="true" /></button>{menuTerritory?.id === territory.id ? <TableActionMenu anchor={menuAnchor} ariaLabel={`Acciones de ${territory.name}`} onDismiss={() => { setMenuTerritory(null); setMenuAnchor(null); }} items={[{ label: "Editar", icon: <Pencil aria-hidden="true" />, onSelect: () => { setMenuTerritory(null); setMenuAnchor(null); onEdit(territory); } }]} /> : null}</div> });
  return <><DataTable ariaLabel="Zonas" items={territories} rowKey={(territory) => territory.id} columns={columns} /><DataTablePagination page={page} totalPages={totalPages} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} ariaLabel="Paginación de zonas" summary={<>Mostrando {territories.length} de {totalElements} zonas</>} /></>;
}
