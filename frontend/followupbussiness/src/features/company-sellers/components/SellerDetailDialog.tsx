import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { Seller } from "../types";

export function SellerDetailDialog({
  seller,
  onClose,
}: {
  seller: Seller;
  onClose: () => void;
}) {
  return (
    <ModalSurface
      titleId="seller-detail-title"
      onDismiss={onClose}
      className="seller-list__dialog"
    >
      <ModalHeader module="Vendedores" title="Detalle de vendedor" titleId="seller-detail-title" onClose={onClose} closeLabel="Cerrar detalle" />
      <dl>
        <div>
          <dt>Nombre completo</dt>
          <dd>{seller.displayName}</dd>
        </div>
        <div>
          <dt>Correo corporativo</dt>
          <dd>{seller.email ?? "—"}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{seller.phone ?? "—"}</dd>
        </div>
        <div>
          <dt>Código de vendedor</dt>
          <dd>{seller.employeeCode ?? "—"}</dd>
        </div>
        <div>
          <dt>Supervisor asignado</dt>
          <dd>{seller.supervisor?.displayName ?? "Sin asignar"}</dd>
        </div>
        <div>
          <dt>Zona / sede</dt>
          <dd>
            {seller.territories.map((territory) => territory.name).join(", ") ||
              "Sin asignar"}
          </dd>
        </div>
      </dl>
      <footer>
        <button
          className="seller-list__secondary"
          type="button"
          onClick={onClose}
        >
          Cerrar
        </button>
      </footer>
    </ModalSurface>
  );
}
