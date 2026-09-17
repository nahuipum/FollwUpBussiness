import { useState } from "react";
import { ArrowRight, Info, TriangleAlert } from "lucide-react";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { Button } from "../../../shared/ui/Button";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import { WorkflowStepper } from "../../../shared/ui/WorkflowStepper";
import type { ApiError } from "../../../lib/api";
import { formatRouteDate, routeLabel } from "../route-label";
import type { Route } from "../types";
import { useRouteDirections } from "../hooks/useRouteDirections";
import { RouteReadOnlySequence } from "./RouteReadOnlySequence";
import { RouteSequenceMap } from "./RouteSequenceMap";

function errorMessage(error: ApiError) {
  switch (error.status) {
    case 403: return "Tu sesión ya no tiene permiso para publicar esta ruta.";
    case 404: return "La ruta ya no está disponible. Actualiza el listado antes de continuar.";
    case 409: return "No se publicó ningún cambio. Carga la versión vigente, revisa nuevamente el orden y confirma otra vez.";
    case 400:
    case 422: return "La ruta no cumple las condiciones actuales para publicarse. Revisa la información y vuelve a intentarlo.";
    default: return "No pudimos publicar la ruta. Inténtalo nuevamente.";
  }
}

type Props = { route: Route; sellerLabel: string; sellerAvailable: boolean; notifySeller: boolean; busy: boolean; error: ApiError | null; onNotifySeller: (value: boolean) => void; onClose: () => void; onEditOrder: () => void; onConfirm: () => void; onReload: () => void };

export function RoutePublishWorkflow({ route, sellerLabel, sellerAvailable, notifySeller, busy, error, onNotifySeller, onClose, onEditOrder, onConfirm, onReload }: Props) {
  const [confirming, setConfirming] = useState(false);
  const directions = useRouteDirections(route);
  const orderedPoints = [...route.points].sort((left, right) => left.sequence - right.sequence);
  return <><section className="route-page-workflow" aria-labelledby="route-publish-title">
    <header className="routes-page__heading route-workflow-heading"><div><span className="route-eyebrow">Planificación operativa</span><h1 id="route-publish-title">Revisar y publicar ruta</h1><p>Confirma el orden final y la versión vigente. Publicar es una operación separada y explícita.</p></div><Button onClick={onClose} disabled={busy} leadingIcon={<ArrowRight aria-hidden="true" />}>Volver al detalle</Button></header>
    <div className="route-publish-workflow route-workflow-card">
      <WorkflowStepper label="Progreso de publicación" steps={[{ label: "Planificación", state: "complete" }, { label: "Orden final", state: "complete" }, { label: "Revisar", state: "current" }, { label: "Publicar" }]} />
      <div className="route-publish-body"><div className="route-info"><Info aria-hidden="true" /><div><strong>La publicación no modifica el orden</strong><p>El servidor revalidará el DRAFT, el vendedor y la versión vigente antes de confirmar.</p></div></div>
        {error && <FormAlert><strong>{error.status === 409 ? "La versión de la ruta cambió" : "No pudimos publicar la ruta"}</strong><p>{errorMessage(error)}</p>{error.status === 409 && <Button size="compact" onClick={onReload} disabled={busy}>Cargar versión actual</Button>}</FormAlert>}
        <div className="route-publish-layout">
          <div className="route-publish-overview"><section className="route-publish-summary"><header className="route-publish-route"><div><span className="route-eyebrow">Ruta a publicar</span><h3>{routeLabel(route)}</h3><p>{sellerLabel} · {formatRouteDate(route.date)}</p></div><span className="route-badge route-badge--neutral">Borrador</span></header><dl className="route-definition"><Detail label="Vendedor" value={sellerLabel} /><Detail label="Fecha operativa" value={formatRouteDate(route.date)} /><Detail label="Versión" value={String(route.version)} /><Detail label="Puntos" value={`${route.points.length} visitas`} /><Detail label="Estado" value="DRAFT" /></dl></section>
            <aside className="route-publish-validation"><div><h3>Validaciones de publicación</h3><ul className="route-publish-checks">{[`Ruta actual en estado ${route.status}`, `Vendedor ${sellerAvailable ? "disponible para validar" : "no disponible"}`, `${route.points.length} puntos en el orden mostrado`, `Versión ${route.version} pendiente de revalidación del servidor`].map((label) => <li key={label}><span aria-hidden="true">✓</span>{label}</li>)}</ul></div><label className="route-publish-dialog__choice"><input type="checkbox" checked={notifySeller} onChange={(event) => onNotifySeller(event.target.checked)} disabled={busy} /><span><strong>Notificar al vendedor</strong><br /><small>La preferencia se envía con la publicación.</small></span></label><div className="route-inline-notice route-inline-notice--warning"><TriangleAlert aria-hidden="true" /><div><strong>Confirma antes de continuar</strong><p>El servidor revalidará estado, vendedor y versión antes de publicar.</p></div></div></aside>
          </div>
          <section className="route-publish-order"><header className="route-publish-order__header"><div><h3>Orden final de visitas</h3><p>Secuencia textual completa y operativa aunque el mapa no esté disponible.</p></div><Button size="compact" onClick={onEditOrder} disabled={busy}>Editar orden</Button></header><RouteReadOnlySequence route={route} layout="stacked" mapPosition="bottom" showMap={false} /></section>
          <details className="route-publish-map route-publish-order" open><summary>Mapa y detalle vial</summary><RouteSequenceMap points={orderedPoints} {...directions} /></details>
        </div>
      </div>
      <footer className="route-planning__footer"><span className={`route-badge route-badge--${sellerAvailable ? "success" : "danger"}`}>{sellerAvailable ? "Lista para publicar" : "Requiere vendedor activo"}</span><div><Button onClick={onClose} disabled={busy}>Guardar y salir</Button><Button variant="primary" onClick={() => setConfirming(true)} disabled={busy || !sellerAvailable || route.points.length === 0}>Continuar a confirmación</Button></div></footer>
    </div>
  </section>{confirming && !error && <ConfirmationDialog titleId="route-publish-confirm-title" title="Confirmar publicación" module="Rutas" headerDescription="El servidor realizará la validación final." message="Confirma que el orden final es correcto. La ruta se publicará y quedará disponible para el vendedor." identity={<strong>{routeLabel(route)} · {sellerLabel} · {route.points.length} puntos · versión {route.version}</strong>} cancelLabel="Volver a revisar" confirmLabel="Confirmar publicación" busyLabel="Publicando…" busy={busy} appearance="golden" onCancel={() => { if (!busy) setConfirming(false); }} onConfirm={onConfirm} />}</>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
