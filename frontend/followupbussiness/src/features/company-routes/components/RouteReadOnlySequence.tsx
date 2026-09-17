import { useRouteDirections } from "../hooks/useRouteDirections";
import type { Route } from "../types";
import { RouteSequenceMap } from "./RouteSequenceMap";

type Props = { route: Route; layout?: "stacked" | "split"; mapPosition?: "bottom" | "side"; compactMap?: boolean; showMap?: boolean };

export function RouteReadOnlySequence({ route, layout = "stacked", mapPosition = "bottom", compactMap = false, showMap = true }: Props) {
  const directions = useRouteDirections(route);
  const points = [...route.points].sort((left, right) => left.sequence - right.sequence);
  const map = <RouteSequenceMap points={points} {...directions} />;
  return <div className={`route-read-only-sequence route-read-only-sequence--${layout} route-read-only-sequence--map-${mapPosition}`}>
    <section className="route-read-only-sequence__visits" aria-labelledby="route-points-title">
      <div className="route-read-only-sequence__heading"><h3 id="route-points-title">Secuencia de visitas</h3><p>Orden planificado de las visitas.</p></div>
      {points.length === 0 ? <p>No hay puntos registrados para esta ruta.</p> : <ol className="route-detail__points">
        {points.map((point, index) => <li key={point.routePointId ?? point.sequence}>
          <strong aria-hidden="true">{point.sequence}</strong>
          <span className="route-detail__point-copy"><span className="route-order-editor__visit-name">{point.customerName ?? "Cliente no disponible"}</span></span>
          <span className="route-order-editor__visit-role">{points.length === 1 ? "Inicio y final" : index === 0 ? "Inicio" : index === points.length - 1 ? "Final" : null}</span>
        </li>)}
      </ol>}
    </section>
    {showMap && (compactMap ? <details className="route-read-only-sequence__map"><summary><span><strong>Vista previa del recorrido</strong><small>Mapa complementario; la secuencia textual conserva el orden.</small></span><span className="route-read-only-sequence__map-status">Detalle vial</span></summary>{map}</details> : <div className="route-read-only-sequence__map">{map}</div>)}
  </div>;
}
