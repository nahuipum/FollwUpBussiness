import { X } from "lucide-react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { Seller } from "../types";

export function SellerDetailDialog({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  return <ModalSurface titleId="seller-detail-title" onDismiss={onClose} className="seller-list__dialog"><header><h2 id="seller-detail-title">Detalle de vendedor</h2><button type="button" aria-label="Cerrar detalle" onClick={onClose}><X aria-hidden="true" /></button></header><dl><div><dt>Nombre completo</dt><dd>{seller.displayName}</dd></div><div><dt>Correo corporativo</dt><dd>{seller.email ?? "—"}</dd></div><div><dt>Teléfono</dt><dd>{seller.phone ?? "—"}</dd></div><div><dt>Código de vendedor</dt><dd>{seller.employeeCode ?? "—"}</dd></div><div><dt>Supervisor asignado</dt><dd>{seller.supervisor?.displayName ?? "Sin asignar"}</dd></div><div><dt>Zona / sede</dt><dd>{seller.territories.map((territory) => territory.name).join(", ") || "Sin asignar"}</dd></div></dl><footer><button className="seller-list__secondary" type="button" onClick={onClose}>Cerrar</button></footer></ModalSurface>;
}
