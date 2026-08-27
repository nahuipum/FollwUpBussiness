import { useEffect, useMemo, useRef, useState } from "react";
import { handleMissingStyleImages } from "../../company-clients/components/map-style";
import type { ApiError } from "../../../lib/api";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import type { RouteDirections, RoutePoint } from "../types";

type MapState = "LOADING" | "ACTIVE" | "LIMITED" | "DISABLED";
type Props = { points: readonly RoutePoint[]; directions?: RouteDirections | null; loading?: boolean; error?: ApiError | null; stale?: boolean; retry?: () => void };

function directionsErrorState(error: ApiError) {
  if (error.status === 403) return {
    title: "No tienes permiso para consultar el detalle vial",
    message: "La lista y el orden de visitas siguen disponibles para tu sesión.",
    canRetry: false,
  };
  if (error.status === 422) return {
    title: "No podemos mostrar el detalle vial",
    message: "No pudimos calcular el recorrido vial con las visitas de esta ruta. Mostramos una secuencia aproximada, no navegación.",
    canRetry: true,
  };
  if (error.status === 503) return {
    title: "El detalle vial no está disponible",
    message: "Mostramos una secuencia aproximada, no navegación. Puedes intentarlo nuevamente en unos segundos.",
    canRetry: true,
  };
  return {
    title: "No pudimos cargar el detalle vial",
    message: "Mostramos una secuencia aproximada, no navegación. Reintenta en unos segundos.",
    canRetry: true,
  };
}

export function RouteSequenceMap({ points, directions = null, loading = false, error = null, stale = false, retry: retryDirections }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import("maplibre-gl").Map | null>(null);
  const markers = useRef<import("maplibre-gl").Marker[]>([]);
  const [state, setState] = useState<MapState>("DISABLED");
  const [retry, setRetry] = useState(0);
  const located = useMemo(() => points.filter((point): point is RoutePoint & { location: NonNullable<RoutePoint["location"]> } => Boolean(point.location)), [points]);
  // Never draw straight-line vectors as though they were a navigable route.
  // While an order preview is loading, markers remain visible behind the overlay.
  const roadGeometry = !stale && directions !== null && directions.geometry.length > 1 ? directions.geometry : null;
  const viewport = useMemo(() => roadGeometry ?? located.map((point) => point.location), [located, roadGeometry]);
  const configured = Boolean(import.meta.env.VITE_GEOAPIFY_TILE_KEY);

  useEffect(() => {
    const key = import.meta.env.VITE_GEOAPIFY_TILE_KEY;
    if (!key || !container.current || viewport.length === 0) { setState("DISABLED"); return; }
    let disposed = false;
    setState("LOADING");
    void Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url")])
      .then(([{ Map, Marker, setWorkerUrl }, { default: workerUrl }]) => {
        if (disposed || !container.current) return;
        setWorkerUrl(workerUrl);
        const first = viewport[0]!;
        const instance = new Map({ container: container.current, center: [first.longitude, first.latitude], zoom: 12, style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${encodeURIComponent(key)}` });
        map.current = instance;
        handleMissingStyleImages(instance);
        instance.on("load", () => {
          if (disposed) return;
          if (roadGeometry) {
            instance.addSource("route-sequence", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: roadGeometry.map((point) => [point.longitude, point.latitude]) } } });
            instance.addLayer({ id: "route-sequence-line", type: "line", source: "route-sequence", paint: { "line-color": "#176d77", "line-width": 4, "line-opacity": .8 } });
          }
          located.forEach((point) => {
            const element = document.createElement("span");
            element.className = "route-sequence-map__marker";
            element.textContent = String(point.sequence);
            element.setAttribute("aria-hidden", "true");
            markers.current.push(new Marker({ element }).setLngLat([point.location.longitude, point.location.latitude]).addTo(instance));
          });
          setState("ACTIVE");
        });
        instance.on("error", () => !disposed && setState("LIMITED"));
      }).catch(() => !disposed && setState("LIMITED"));
    return () => { disposed = true; markers.current = []; map.current?.remove(); map.current = null; };
  }, [located, retry, roadGeometry, viewport]);

  const unavailableMessage = !configured
    ? "El mapa aún no está configurado en este entorno. La lista y el orden siguen disponibles."
    : "Esta ruta no tiene ubicaciones de clientes suficientes para dibujar el recorrido aproximado. La lista y el orden siguen disponibles.";
  const directionsError = error ? directionsErrorState(error) : null;
  const hasMapCanvas = viewport.length > 0 && configured;
  const mapLoading = hasMapCanvas && state === "LOADING";
  const showLoadingOverlay = hasMapCanvas && (loading || mapLoading);
  return <section className="route-sequence-map" aria-labelledby="route-sequence-map-title">
    <h3 id="route-sequence-map-title">Detalle vial</h3>
    <p>{roadGeometry ? "La línea muestra el recorrido vial para el orden actual." : loading ? "Actualizamos el recorrido vial para el nuevo orden. No es navegación por calles hasta que termine la actualización." : "Los puntos de visita se mantienen visibles mientras el detalle vial no está disponible. No es navegación por calles."}</p>
    {hasMapCanvas && <div className="route-sequence-map__canvas-wrapper" aria-busy={showLoadingOverlay}>
      <div ref={container} className="route-sequence-map__canvas" aria-label={roadGeometry ? "Mapa con detalle vial de la ruta" : "Mapa de la secuencia aproximada"} />
      {showLoadingOverlay && <ModalAsyncState className="route-sequence-map__loading-overlay" state="loading" title={loading ? "Cargando detalle vial" : "Cargando mapa"} message={loading ? "Estamos preparando el recorrido vial para el orden guardado." : "Estamos preparando la vista del mapa."} />}
    </div>}
    {loading && !hasMapCanvas && <ModalAsyncState state="loading" title="Cargando detalle vial" message="Estamos preparando el recorrido vial para el orden guardado." />}
    {stale && <p role="status">Actualizamos el recorrido vial para el nuevo orden.</p>}
    {directionsError && <FormAlert><strong>{directionsError.title}</strong><p>{directionsError.message}</p>{directionsError.canRetry && retryDirections && <button className="route-list__secondary" type="button" onClick={retryDirections}>Reintentar detalle vial</button>}</FormAlert>}
    {state === "ACTIVE" && !loading && !error && <p role="status">{roadGeometry ? "Detalle vial disponible." : "Puntos de visita disponibles."}</p>}
    {state === "LIMITED" && <ModalAsyncState state="error" title="No pudimos cargar el mapa" message="La lista y el orden siguen disponibles." primaryAction={{ label: "Reintentar mapa", onClick: () => setRetry((value) => value + 1) }} />}
    {(!configured || viewport.length === 0) && <p role="status">{unavailableMessage}</p>}
  </section>;
}
