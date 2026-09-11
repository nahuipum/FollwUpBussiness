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
  lastUpdated,
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
  lastUpdated?: Date | null;
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
  const closeMenuForAction = (seller: Seller) => {
    setMenuSeller(null);
    triggers.current[seller.id]?.focus();
  };
  const dismissMenu = () => {
    const openSeller = menuSeller;
    setMenuSeller(null);
    if (openSeller) triggers.current[openSeller.id]?.focus();
  };
  const columns: readonly DataTableColumn<Seller>[] = [
    {
      id: "seller",
      header: "Vendedor",
      label: "Vendedor",
      width: "25%",
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
      header: "Zona / territorio",
      label: "Zona / territorio",
      width: "18%",
      render: (seller) =>
        seller.territories.length ? <span className="seller-list__territories">{seller.territories.map((territory) => <span key={territory.id}>{territory.name}</span>)}</span> : "Sin asignar",
    },
    {
      id: "supervisor",
      header: "Supervisor",
      label: "Supervisor",
      width: "17%",
      render: (seller) => seller.supervisor?.displayName ?? "Sin asignar",
    },
    {
      id: "status",
      header: "Estado",
      label: "Estado",
      width: "17%",
      render: (seller) => (
        <DataTableStatus
          label={statusLabel[seller.status]}
          tone={seller.status === "ACTIVE" ? "success" : seller.status === "INACTIVE" ? "danger" : "warning"}
        />
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      label: "Acciones",
      width: "10%",
      align: "center",
      render: (seller) => (
        <div className="seller-list__actions">
          <button
            ref={(node) => {
              triggers.current[seller.id] = node;
            }}
            className="data-table__icon-button data-table__icon-button--golden"
            type="button"
            aria-label={`Más acciones para ${seller.displayName}`}
            aria-expanded={menuSeller?.id === seller.id}
            aria-haspopup="menu"
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
              variant="golden"
              onDismiss={dismissMenu}
              items={[
                {
                  label: "Ver detalle",
                  icon: <Eye aria-hidden="true" />,
                  onSelect: () => {
                    closeMenuForAction(seller);
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
                                closeMenuForAction(seller);
                                onResendInvitation(seller);
                              },
                            },
                          ]
                        : []),
                      {
                        label: "Editar",
                        icon: <Pencil aria-hidden="true" />,
                        onSelect: () => {
                          closeMenuForAction(seller);
                          onEdit(seller);
                        },
                      },
                      {
                        label: seller.supervisorId ? "Reasignar supervisor" : "Asignar supervisor",
                        icon: <UserRoundCheck aria-hidden="true" />,
                        onSelect: () => { closeMenuForAction(seller); onAssign(seller, "supervisor"); },
                      },
                      {
                        label: "Asignar territorios",
                        icon: <MapPinned aria-hidden="true" />,
                        onSelect: () => { closeMenuForAction(seller); onAssign(seller, "territories"); },
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
                                closeMenuForAction(seller);
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
        responsive="cards"
        variant="golden"
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
            Mostrando {firstResult(page, pageSize, totalElements)}–
            {lastResult(page, pageSize, totalElements)} de {totalElements} vendedores
          </>
        }
        lastUpdated={lastUpdated}
        variant="golden"
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

function firstResult(page: number, pageSize: number, totalElements: number) {
  if (totalElements === 0) return 0;
  return Math.min(page * pageSize + 1, totalElements);
}

function lastResult(page: number, pageSize: number, totalElements: number) {
  if (totalElements === 0) return 0;
  return Math.min((page + 1) * pageSize, totalElements);
}
