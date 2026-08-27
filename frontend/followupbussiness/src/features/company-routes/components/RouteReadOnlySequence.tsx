import { useRouteDirections } from "../hooks/useRouteDirections";
import type { Route } from "../types";
import { RouteSequenceMap } from "./RouteSequenceMap";

export function RouteReadOnlySequence({ route }: { route: Route }) {
  const directions = useRouteDirections(route);
  const points = [...route.points].sort((left, right) => left.sequence - right.sequence);
  return <div className="route-read-only-sequence">
    <RouteSequenceMap points={points} {...directions} />
    <section className="route-read-only-sequence__visits" aria-labelledby="route-points-title">
      <h3 id="route-points-title">Visitas programadas</h3>
      {points.length === 0 ? <p>No hay puntos registrados para esta ruta.</p> : <ol className="route-detail__points">
        {points.map((point, index) => <li key={point.routePointId ?? point.sequence}>
          <strong aria-hidden="true">{point.sequence}</strong>
          <span className="route-order-editor__visit-name">{point.customerName ?? "Cliente no disponible"}</span>
          <span className="route-order-editor__visit-role">{points.length === 1 ? "Inicio y final" : index === 0 ? "Inicio" : index === points.length - 1 ? "Final" : null}</span>
        </li>)}
      </ol>}
    </section>
  </div>;
}
