import { useState } from "react";
import { ArrowRight, CheckCircle2, Info, TriangleAlert } from "lucide-react";
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

function errorPresentation(error: ApiError) {
  if (error.code === "SNAPSHOT_EXPIRED") return {
    title: "La planificación de la ruta venció",
    message: "La fecha operativa y sus validaciones ya no están vigentes. Crea o copia la ruta para una fecha actual o futura antes de publicarla.",
    reload: false,
  };
  if (error.code === "SNAPSHOT_MISSING" || error.code === "SNAPSHOT_INCOMPLETE" || error.code === "SNAPSHOT_STALE") return {
    title: "La ruta no tiene una planificación vigente",
    message: "Revisa y guarda nuevamente la planificación antes de intentar publicarla.",
    reload: false,
  };
  if (error.code === "ROUTE_STATE_CONFLICT") return {
    title: "El estado de la ruta cambió",
    message: "La ruta ya no está en borrador. Carga su estado actual antes de continuar.",
    reload: true,
  };
  if (error.code === "ROUTE_VERSION_CONFLICT") return {
    title: "La versión de la ruta cambió",
    message: "No se publicó ningún cambio. Carga la versión vigente, revisa nuevamente el orden y confirma otra vez.",
    reload: true,
  };
  switch (error.status) {
    case 403: return { title: "No tienes permiso para publicar", message: "Tu sesión ya no tiene permiso para publicar esta ruta.", reload: false };
    case 404: return { title: "La ruta ya no está disponible", message: "Actualiza el listado antes de continuar.", reload: false };
    case 409: return { title: "La publicación entró en conflicto", message: "No se publicó ningún cambio. Carga el estado actual de la ruta antes de continuar.", reload: true };
    case 400:
    case 422: return { title: "No pudimos publicar la ruta", message: "La ruta no cumple las condiciones actuales para publicarse. Revisa la información y vuelve a intentarlo.", reload: false };
    default: return { title: "No pudimos publicar la ruta", message: "No pudimos publicar la ruta. Inténtalo nuevamente.", reload: false };
  }
}

type Props = { route: Route; sellerLabel: string; sellerAvailable: boolean; notifySeller: boolean; busy: boolean; error: ApiError | null; onNotifySeller: (value: boolean) => void; onClose: () => void; onEditOrder: () => void; onConfirm: () => void; onReload: () => void };

export function RoutePublishWorkflow({ route, sellerLabel, sellerAvailable, notifySeller, busy, error, onNotifySeller, onClose, onEditOrder, onConfirm, onReload }: Props) {
  const [confirming, setConfirming] = useState(false);
  const directions = useRouteDirections(route);
  const orderedPoints = [...route.points].sort((left, right) => left.sequence - right.sequence);
  const canRetry = Boolean(error && ![403, 404, 409].includes(error.status));
  const errorCopy = error ? errorPresentation(error) : null;
  return <><section className="route-page-workflow" aria-labelledby="route-publish-title">
    <header className="routes-page__heading route-workflow-heading"><div><span className="route-eyebrow">Planificación operativa</span><h1 id="route-publish-title">Revisar y publicar ruta</h1><p>Confirma el orden final y la versión vigente. Publicar es una operación separada y explícita.</p></div><Button onClick={onClose} disabled={busy} leadingIcon={<ArrowRight aria-hidden="true" />}>Volver al detalle</Button></header>
    <div className="route-publish-workflow route-workflow-card">
      <WorkflowStepper label="Progreso de publicación" steps={[{ label: "Planificación", state: "complete" }, { label: "Orden final", state: "complete" }, { label: "Revisar", state: "current" }, { label: "Publicar" }]} />
      <div className="route-publish-body"><div className="route-info"><Info aria-hidden="true" /><div><strong>La publicación no modifica el orden</strong><p>El servidor revalidará el DRAFT, el vendedor y la versión vigente antes de confirmar.</p></div></div>
        {error && errorCopy && <FormAlert><strong>{errorCopy.title}</strong><p>{errorCopy.message}</p>{errorCopy.reload && <Button size="compact" onClick={onReload} disabled={busy}>Cargar estado actual</Button>}</FormAlert>}
        <div className="route-publish-layout">
          <div className="route-publish-overview"><section className="route-publish-summary"><header className="route-publish-route"><div><span className="route-eyebrow">Ruta a publicar</span><h3>{routeLabel(route)}</h3><p>{sellerLabel} · {formatRouteDate(route.date)}</p></div><span className="route-badge route-badge--neutral">Borrador</span></header><dl className="route-definition"><Detail label="Vendedor" value={sellerLabel} /><Detail label="Fecha operativa" value={formatRouteDate(route.date)} /><Detail label="Versión" value={String(route.version)} /><Detail label="Puntos" value={`${route.points.length} visitas`} /><Detail label="Estado" value="DRAFT" /></dl></section>
            <aside className="route-publish-validation"><div><h3>Validaciones de publicación</h3><ul className="route-publish-checks">{[`Ruta actual en estado ${route.status}`, `Vendedor ${sellerAvailable ? "disponible para validar" : "no disponible"}`, `${route.points.length} puntos en el orden mostrado`, `Versión ${route.version} pendiente de revalidación del servidor`].map((label) => <li key={label}><span aria-hidden="true">✓</span>{label}</li>)}</ul></div><label className="route-publish-dialog__choice"><input type="checkbox" checked={notifySeller} onChange={(event) => onNotifySeller(event.target.checked)} disabled={busy} /><span><strong>Notificar al vendedor</strong><br /><small>La preferencia se envía con la publicación.</small></span></label><div className="route-inline-notice route-inline-notice--warning"><TriangleAlert aria-hidden="true" /><div><strong>Confirma antes de continuar</strong><p>El servidor revalidará estado, vendedor y versión antes de publicar.</p></div></div></aside>
          </div>
          <section className="route-publish-order"><header className="route-publish-order__header"><div><h3>Orden final de visitas</h3><p>Secuencia textual completa y operativa aunque el mapa no esté disponible.</p></div><Button size="compact" onClick={onEditOrder} disabled={busy}>Editar orden</Button></header><RouteReadOnlySequence route={route} layout="stacked" mapPosition="bottom" showMap={false} /></section>
          <details className="route-publish-map route-publish-order" open><summary>Mapa y detalle vial</summary><RouteSequenceMap points={orderedPoints} {...directions} /></details>
        </div>
      </div>
      <footer className="route-planning__footer"><p className={`route-publish-readiness route-publish-readiness--${sellerAvailable ? "success" : "danger"}`} role="status">{sellerAvailable ? <CheckCircle2 aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}<span><strong>{sellerAvailable ? "Todo listo para confirmar" : "Requiere vendedor activo"}</strong><small>{sellerAvailable ? "El servidor hará la validación final al publicar." : "Selecciona un vendedor activo antes de continuar."}</small></span></p><div><Button onClick={onClose} disabled={busy}>Guardar y salir</Button><Button variant="primary" onClick={() => setConfirming(true)} disabled={busy || !sellerAvailable || route.points.length === 0}>Continuar a confirmación</Button></div></footer>
    </div>
  </section>{confirming && (!error || canRetry) && <ConfirmationDialog titleId="route-publish-confirm-title" title="Confirmar publicación" module="Rutas" headerDescription="El servidor realizará la validación final." message="Confirma que el orden final es correcto. La ruta se publicará y quedará disponible para el vendedor." identity={<strong>{routeLabel(route)} · {sellerLabel} · {formatRouteDate(route.date)} · {route.points.length} puntos · versión {route.version}</strong>} cancelLabel="Volver a revisar" confirmLabel={canRetry ? "Reintentar publicación" : "Confirmar publicación"} busyLabel="Publicando…" busy={busy} error={canRetry ? errorCopy?.message ?? null : null} errorTitle={errorCopy?.title ?? "No pudimos publicar la ruta"} onCancel={() => { if (!busy) setConfirming(false); }} onConfirm={onConfirm} />}</>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
