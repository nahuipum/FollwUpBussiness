import { DataTable, DataTableIdentity, DataTablePagination, DataTableStatus, type DataTableColumn } from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import type { Client } from "../types";

export function ClientTable({ clients, page, pageSize, totalPages, totalElements, onPageChange, onPageSizeChange }: {
  clients: readonly Client[];
  page: number;
  pageSize: DataTablePageSize;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: DataTablePageSize) => void;
}) {
  const columns: readonly DataTableColumn<Client>[] = [
    { id: "client", header: "Cliente", label: "Cliente", width: "34%", render: (client) => <DataTableIdentity mark={initials(client.name)} primary={client.name} /> },
    { id: "segment", header: "Segmento", label: "Segmento", width: "25%", render: (client) => client.segment ?? "—" },
    { id: "sellers", header: "Vendedores asignados", label: "Vendedores asignados", width: "22%", render: (client) => client.assignedSellerIds.length },
    { id: "status", header: "Estado", label: "Estado", width: "19%", render: (client) => <DataTableStatus label={client.status === "ACTIVE" ? "Activo" : "Inactivo"} tone={client.status === "ACTIVE" ? "success" : "warning"} /> },
  ];
  return <>
    <DataTable ariaLabel="Clientes" items={clients} rowKey={(client) => client.id} columns={columns} />
    <DataTablePagination
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      ariaLabel="Paginación de clientes"
      summary={<>Mostrando {clients.length} de {totalElements} clientes</>}
    />
  </>;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
