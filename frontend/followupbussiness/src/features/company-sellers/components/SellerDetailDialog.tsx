import { X } from "lucide-react";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import type { Seller } from "../types";

export function SellerDetailDialog({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  return <DrawerSurface titleId="seller-detail-title" descriptionId="seller-detail-description" onDismiss={onClose} className="seller-list__drawer" header={<DrawerHeader titleId="seller-detail-title" title="Detalle de vendedor" descriptionId="seller-detail-description" description="Información actual del registro seleccionado." onClose={onClose} />} footer={<button className="seller-list__secondary" type="button" onClick={onClose}>Cerrar</button>}>
    <section className="seller-list__detail"><div className="seller-list__detail-identity"><span>{initials(seller.displayName)}</span><div><strong>{seller.displayName}</strong><small>{seller.email ?? "Sin correo registrado"}</small></div></div><dl className="seller-list__detail-grid"><Field label="Correo corporativo" value={seller.email ?? "Sin correo registrado"} /><Field label="Estado" value={statusLabel[seller.status]} /><Field label="Teléfono" value={seller.phone ?? "—"} /><Field label="Código de vendedor" value={seller.employeeCode ?? "—"} /><Field label="Supervisor asignado" value={seller.supervisor?.displayName ?? "Sin asignar"} /><Field label="Zona / territorio" value={seller.territories.map((territory) => territory.name).join(", ") || "Sin asignar"} /></dl></section>
  </DrawerSurface>;
}

export function DrawerHeader({ titleId, title, descriptionId, description, onClose, busy = false }: { titleId: string; title: string; descriptionId?: string; description: string; onClose: () => void; busy?: boolean }) { return <div className="seller-list__drawer-header"><div><span className="seller-list__eyebrow">Vendedores</span><h2 id={titleId}>{title}</h2><p {...(descriptionId ? { id: descriptionId } : {})}>{description}</p></div><button className="seller-list__drawer-close" type="button" aria-label="Cerrar" onClick={onClose} disabled={busy}><X aria-hidden="true" /></button></div>; }
function Field({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
const statusLabel = { ACTIVE: "Activo", INACTIVE: "Inactivo", INVITED: "Pendiente de invitación" } as const;
