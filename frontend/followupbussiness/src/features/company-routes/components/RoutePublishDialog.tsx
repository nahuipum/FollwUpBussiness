import { FormAlert } from "../../../shared/ui/FormAlert";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { ApiError } from "../../../lib/api";
import { routeLabel } from "../route-label";
import type { Route } from "../types";

function errorMessage(error: ApiError) {
  switch (error.status) {
    case 403: return "Tu sesión ya no tiene permiso para publicar esta ruta.";
    case 404: return "La ruta ya no está disponible. Actualiza el listado antes de continuar.";
    case 409: return "La publicación fue bloqueada. Verifica que la empresa tenga jornada de planificación y que el borrador cuente con un snapshot válido.";
    case 400:
    case 422: return "La ruta no cumple las condiciones actuales para publicarse. Revisa la información y vuelve a intentarlo.";
    default: return "No pudimos publicar la ruta. Inténtalo nuevamente.";
  }
}

export function RoutePublishDialog({ route, sellerLabel, sellerAvailable, notifySeller, busy, error, onNotifySeller, onClose, onConfirm, onReload }: { route: Route; sellerLabel: string; sellerAvailable: boolean; notifySeller: boolean; busy: boolean; error: ApiError | null; onNotifySeller: (value: boolean) => void; onClose: () => void; onConfirm: () => void; onReload: () => void }) {
  return <ModalSurface titleId="route-publish-title" onDismiss={onClose} className="route-detail route-detail--publish"><ModalHeader module="Rutas" title="Publicar ruta" titleId="route-publish-title" onClose={onClose} closeLabel="Cancelar publicación" closeDisabled={busy} />
    <p>Confirma la publicación de esta ruta. La información se validará nuevamente antes de aplicar el cambio.</p>
    <dl><Detail label="Ruta" value={routeLabel(route)} /><Detail label="Vendedor" value={sellerLabel} /><Detail label="Fecha operativa" value={route.date} /><Detail label="Estado actual" value="Borrador" /><Detail label="Disponibilidad del vendedor" value={sellerAvailable ? "Activo" : "No disponible"} /></dl>
    <label className="route-publish-dialog__choice"><input type="checkbox" checked={notifySeller} onChange={(event) => onNotifySeller(event.target.checked)} disabled={busy} /><span>Notificar al vendedor después de publicar</span></label>
    {error && <FormAlert><strong>{error.status === 409 ? "No se pudo publicar la ruta" : "No pudimos publicar la ruta"}</strong><p>{errorMessage(error)}</p>{error.status === 409 && <button className="route-list__secondary" type="button" onClick={onReload} disabled={busy}>Recargar ruta</button>}</FormAlert>}
    <footer><button className="route-list__secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="route-list__primary" type="button" onClick={onConfirm} disabled={busy || !sellerAvailable}>{busy ? "Publicando…" : "Confirmar publicación"}</button></footer>
  </ModalSurface>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
