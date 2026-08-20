import { DataTable, DataTableIdentity, DataTablePagination, DataTableStatus, type DataTableColumn } from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import type { Client } from "../types";
import { Eye, MoreVertical, Pencil, Power } from "lucide-react";
import { useRef, useState } from "react";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";

export function ClientTable({ clients, page, pageSize, totalPages, totalElements, canManage, onDetail, onEdit, onChangeStatus, onPageChange, onPageSizeChange }: {
  clients: readonly Client[];
  page: number;
  pageSize: DataTablePageSize;
  totalPages: number;
  totalElements: number;
  canManage: boolean;
  onDetail: (client: Client) => void;
  onEdit: (client: Client) => void;
  onChangeStatus: (client: Client) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: DataTablePageSize) => void;
}) {
  const [menuClient, setMenuClient] = useState<Client | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const columns: readonly DataTableColumn<Client>[] = [
    { id: "client", header: "Cliente", label: "Cliente", width: "32%", render: (client) => <DataTableIdentity mark={initials(client.name)} primary={client.name} /> },
    { id: "segment", header: "Segmento", label: "Segmento", width: "23%", render: (client) => client.segment ?? "—" },
    { id: "sellers", header: "Vendedores asignados", label: "Vendedores asignados", width: "21%", render: (client) => client.assignedSellerIds.length },
    { id: "status", header: "Estado", label: "Estado", width: "15%", render: (client) => <DataTableStatus label={client.status === "ACTIVE" ? "Activo" : "Inactivo"} tone={client.status === "ACTIVE" ? "success" : "warning"} /> },
    {
      id: "actions",
      header: "Acciones",
      label: "Acciones",
      width: "9%",
      align: "center",
      render: (client) => (
        <div className="client-list__actions">
          <button
            ref={(node) => { triggers.current[client.id] = node; }}
            className="data-table__icon-button"
            type="button"
            aria-label={`Más acciones para ${client.name}`}
            aria-expanded={menuClient?.id === client.id}
            onClick={() => setMenuClient(menuClient?.id === client.id ? null : client)}
          >
            <MoreVertical aria-hidden="true" />
          </button>
          {menuClient?.id === client.id && (
            <TableActionMenu
              anchor={triggers.current[client.id] ?? null}
              ariaLabel={`Acciones de ${client.name}`}
              onDismiss={() => setMenuClient(null)}
              items={[
                {
                  label: "Ver cliente",
                  icon: <Eye aria-hidden="true" />,
                  onSelect: () => { setMenuClient(null); onDetail(client); },
                },
                ...(canManage ? [
                  {
                    label: "Editar cliente",
                    icon: <Pencil aria-hidden="true" />,
                    onSelect: () => { setMenuClient(null); onEdit(client); },
                  },
                  {
                    label: client.status === "ACTIVE" ? "Inactivar cliente" : "Activar cliente",
                    icon: <Power aria-hidden="true" />,
                    tone: client.status === "ACTIVE" ? ("danger" as const) : ("default" as const),
                    onSelect: () => {
                      setMenuClient(null);
                      triggers.current[client.id]?.focus();
                      onChangeStatus(client);
                    },
                  },
                ] : []),
              ]}
            />
          )}
        </div>
      ),
    },
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
