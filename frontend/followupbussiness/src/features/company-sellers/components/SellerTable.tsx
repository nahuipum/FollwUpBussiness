import { Eye, MapPinned, MoreVertical, Pencil, Power, Send, UserRoundCheck } from "lucide-react";
import { useRef, useState } from "react";
import {
  DataTable,
  DataTableIdentity,
  DataTablePagination,
  DataTableStatus,
  type DataTableColumn,
} from "../../../shared/ui/DataTable";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";
import { TableActionMenu } from "../../../shared/ui/TableActionMenu";
import type { Seller } from "../types";

export function SellerTable({
  sellers,
  page,
  totalPages,
  totalElements,
  pageSize,
  canManage,
  onPageChange,
  onPageSizeChange,
  onDetail,
  onEdit,
  onAssign,
  onChangeStatus,
  onResendInvitation,
}: {
  sellers: readonly Seller[];
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: DataTablePageSize;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: DataTablePageSize) => void;
  onDetail: (seller: Seller) => void;
  onEdit: (seller: Seller) => void;
  onAssign: (seller: Seller, kind: "supervisor" | "territories") => void;
  onChangeStatus: (seller: Seller) => void;
  onResendInvitation: (seller: Seller) => void;
}) {
  const [menuSeller, setMenuSeller] = useState<Seller | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const columns: readonly DataTableColumn<Seller>[] = [
    {
      id: "seller",
      header: "Vendedor",
      label: "Vendedor",
      width: "24%",
      render: (seller) => (
        <DataTableIdentity
          mark={initials(seller.displayName)}
          primary={seller.displayName}
          secondary={seller.email ?? "—"}
        />
      ),
    },
    {
      id: "contact",
      header: "Teléfono",
      label: "Teléfono",
      width: "13%",
      render: (seller) => seller.phone ?? "—",
    },
    {
      id: "territory",
      header: "Zona / sede",
      label: "Zona / sede",
      width: "15%",
      render: (seller) =>
        seller.territories.map((territory) => territory.name).join(", ") ||
        "Sin asignar",
    },
    {
      id: "supervisor",
      header: "Supervisor",
      label: "Supervisor",
      width: "16%",
      render: (seller) => seller.supervisor?.displayName ?? "Sin asignar",
    },
    {
      id: "status",
      header: "Estado",
      label: "Estado",
      width: "1%",
      render: (seller) => (
        <DataTableStatus
          label={statusLabel[seller.status]}
          tone={seller.status === "ACTIVE" ? "success" : "warning"}
        />
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      label: "Acciones",
      width: "1%",
      align: "center",
      render: (seller) => (
        <div className="seller-list__actions">
          <button
            ref={(node) => {
              triggers.current[seller.id] = node;
            }}
            className="data-table__icon-button"
            type="button"
            aria-label={`Más acciones para ${seller.displayName}`}
            aria-expanded={menuSeller?.id === seller.id}
            onClick={() =>
              setMenuSeller(menuSeller?.id === seller.id ? null : seller)
            }
          >
            <MoreVertical aria-hidden="true" />
          </button>
          {menuSeller?.id === seller.id && (
            <TableActionMenu
              anchor={triggers.current[seller.id] ?? null}
              ariaLabel={`Acciones de ${seller.displayName}`}
              onDismiss={() => setMenuSeller(null)}
              items={[
                {
                  label: "Ver detalle",
                  icon: <Eye aria-hidden="true" />,
                  onSelect: () => {
                    setMenuSeller(null);
                    onDetail(seller);
                  },
                },
                ...(canManage
                  ? [
                      ...(seller.status === "INVITED"
                        ? [
                            {
                              label: "Reenviar invitación",
                              icon: <Send aria-hidden="true" />,
                              onSelect: () => {
                                setMenuSeller(null);
                                onResendInvitation(seller);
                              },
                            },
                          ]
                        : []),
                      {
                        label: "Editar",
                        icon: <Pencil aria-hidden="true" />,
                        onSelect: () => {
                          setMenuSeller(null);
                          onEdit(seller);
                        },
                      },
                      {
                        label: seller.supervisorId ? "Reasignar supervisor" : "Asignar supervisor",
                        icon: <UserRoundCheck aria-hidden="true" />,
                        onSelect: () => { setMenuSeller(null); onAssign(seller, "supervisor"); },
                      },
                      {
                        label: "Asignar territorios",
                        icon: <MapPinned aria-hidden="true" />,
                        onSelect: () => { setMenuSeller(null); onAssign(seller, "territories"); },
                      },
                      ...(seller.status !== "INVITED"
                        ? [
                            {
                              label:
                                seller.status === "ACTIVE"
                                  ? "Inactivar"
                                  : "Activar",
                              icon: <Power aria-hidden="true" />,
                              tone:
                                seller.status === "ACTIVE"
                                  ? ("danger" as const)
                                  : ("default" as const),
                              onSelect: () => {
                                setMenuSeller(null);
                                triggers.current[seller.id]?.focus();
                                onChangeStatus(seller);
                              },
                            },
                          ]
                        : []),
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <DataTable
        ariaLabel="Vendedores"
        items={sellers}
        rowKey={(seller) => seller.id}
        columns={columns}
      />
      <DataTablePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        ariaLabel="Paginación de vendedores"
        summary={
          <>
            Mostrando {sellers.length} de {totalElements} vendedores
          </>
        }
      />
    </>
  );
}
const statusLabel = {
  INVITED: "Pendiente de invitación",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
} as const;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
