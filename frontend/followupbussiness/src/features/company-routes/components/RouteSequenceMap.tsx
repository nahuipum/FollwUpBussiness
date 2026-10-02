import { useEffect, useMemo, useRef, useState } from "react";
import { handleMissingStyleImages } from "../../company-clients/components/map-style";
import { loadMapLibre } from "../../company-clients/components/maplibre-loader";
import { currentGeoapifyMapStyleUrl, useGeoapifyMapStyleUrl } from "../../../shared/maps/geoapify-map-theme";
import type { ApiError } from "../../../lib/api";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import { Button } from "../../../shared/ui/Button";
import type { RouteDirections, RoutePoint } from "../types";

type MapState = "LOADING" | "ACTIVE" | "LIMITED" | "DISABLED";
type Props = { points: readonly RoutePoint[]; directions?: RouteDirections | null; loading?: boolean; error?: ApiError | null; stale?: boolean; retry?: () => void; previewUnavailable?: boolean; variant?: "card" | "embedded" };

function directionsErrorState(error: ApiError) {
  if (error.status === 403) return {
    title: "No tienes permiso para consultar el detalle vial",
    message: "La lista y el orden de visitas siguen disponibles para tu sesión.",
    canRetry: false,
  };
  if (error.status === 422) return {
    title: "No podemos mostrar el detalle vial",
    message: "No pudimos calcular el recorrido vial. Las ubicaciones válidas permanecen visibles y la lista sigue operativa.",
    canRetry: true,
  };
  if (error.status === 503) return {
    title: "El detalle vial no está disponible",
    message: "Las ubicaciones válidas permanecen visibles. Puedes intentarlo nuevamente en unos segundos.",
    canRetry: true,
  };
  return {
    title: "No pudimos cargar el detalle vial",
    message: "Las ubicaciones válidas permanecen visibles. Reintenta en unos segundos.",
    canRetry: true,
  };
}

export function RouteSequenceMap({ points, directions = null, loading = false, error = null, stale = false, retry: retryDirections, previewUnavailable = false, variant = "card" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import("maplibre-gl").Map | null>(null);
  const mapStyleUrlRef = useRef<string | null>(null);
  const markers = useRef<import("maplibre-gl").Marker[]>([]);
  const [state, setState] = useState<MapState>("DISABLED");
  const [retry, setRetry] = useState(0);
  const orderedPoints = useMemo(() => [...points].sort((left, right) => left.sequence - right.sequence), [points]);
  const located = useMemo(() => orderedPoints.filter((point): point is RoutePoint & { location: NonNullable<RoutePoint["location"]> } => Boolean(point.location)), [orderedPoints]);
  const missingLocationNames = useMemo(() => orderedPoints.filter((point) => !point.location).map((point) => point.customerName ?? "Cliente no disponible"), [orderedPoints]);
  const firstSequence = orderedPoints[0]?.sequence;
  const lastSequence = orderedPoints.at(-1)?.sequence;
  const intermediateStops = Math.max(0, orderedPoints.length - 2);
  // Never draw straight-line vectors as though they were a navigable route.
  // While an order preview is loading, markers remain visible behind the overlay.
  const roadGeometry = !stale && directions !== null && directions.geometry.length > 1 ? directions.geometry : null;
  const viewport = useMemo(() => roadGeometry ?? located.map((point) => point.location), [located, roadGeometry]);
  const key = import.meta.env.VITE_GEOAPIFY_TILE_KEY;
  const configured = Boolean(key);
  const mapStyleUrl = useGeoapifyMapStyleUrl(key);

  useEffect(() => { mapStyleUrlRef.current = mapStyleUrl; if (mapStyleUrl) map.current?.setStyle(mapStyleUrl); }, [mapStyleUrl]);

  useEffect(() => {
    const initialMapStyleUrl = mapStyleUrlRef.current;
    if (!initialMapStyleUrl || !container.current || viewport.length === 0) { setState("DISABLED"); return; }
    let disposed = false;
    let observer: ResizeObserver | null = null;
    setState("LOADING");
    void loadMapLibre()
      .then(({ Map, Marker }) => {
        const latestMapStyleUrl = currentGeoapifyMapStyleUrl(key);
        mapStyleUrlRef.current = latestMapStyleUrl;
        if (disposed || !container.current || !latestMapStyleUrl) return;
        const first = viewport[0]!;
        const instance = new Map({ container: container.current, center: [first.longitude, first.latitude], zoom: 12, style: latestMapStyleUrl });
        map.current = instance;
        handleMissingStyleImages(instance);
        // The modal and responsive grid may settle after MapLibre has initialized.
        // Observe actual dimensions instead of relying on one animation frame.
        if (typeof ResizeObserver !== "undefined" && container.current) {
          observer = new ResizeObserver(() => { if (!disposed) instance.resize?.(); });
          observer.observe(container.current);
        }
        const addRoadGeometry = () => {
          if (disposed || !roadGeometry || instance.getSource("route-sequence")) return;
          instance.addSource("route-sequence", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: roadGeometry.map((point) => [point.longitude, point.latitude]) } } });
          const routeColor = getComputedStyle(document.documentElement).getPropertyValue("--visual-brand").trim() || "#2563eb";
          instance.addLayer({ id: "route-sequence-line-casing", type: "line", source: "route-sequence", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": .55 } });
          instance.addLayer({ id: "route-sequence-line", type: "line", source: "route-sequence", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": routeColor, "line-width": 4, "line-opacity": .95 } });
          instance.addLayer({ id: "route-sequence-direction", type: "symbol", source: "route-sequence", layout: { "symbol-placement": "line", "symbol-spacing": 100, "text-field": "▶", "text-size": 11, "text-rotation-alignment": "map", "text-keep-upright": false }, paint: { "text-color": "#ffffff", "text-halo-color": routeColor, "text-halo-width": 1.5 } });
        };
        instance.on("style.load", addRoadGeometry);
        instance.on("load", () => {
          if (disposed) return;
          addRoadGeometry();
          located.forEach((point) => {
            const element = document.createElement("span");
            element.className = "route-sequence-map__marker";
            if (point.sequence === firstSequence) element.classList.add("route-sequence-map__marker--start");
            if (point.sequence === lastSequence) element.classList.add("route-sequence-map__marker--end");
            element.textContent = String(point.sequence);
            element.setAttribute("aria-hidden", "true");
            markers.current.push(new Marker({ element }).setLngLat([point.location.longitude, point.location.latitude]).addTo(instance));
          });
          if (viewport.length > 1) {
            const longitudes = viewport.map((point) => point.longitude);
            const latitudes = viewport.map((point) => point.latitude);
            instance.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 48, maxZoom: 15, duration: 0 });
          }
          // Modal/grid layout may settle after MapLibre initializes; resize once so tiles and markers are not painted into a zero-sized canvas.
          requestAnimationFrame(() => { if (!disposed) instance.resize?.(); });
          setState("ACTIVE");
        });
        instance.on("error", () => !disposed && setState("LIMITED"));
      }).catch(() => !disposed && setState("LIMITED"));
    return () => { disposed = true; observer?.disconnect(); markers.current = []; map.current?.remove(); map.current = null; };
  }, [firstSequence, lastSequence, located, retry, roadGeometry, viewport]);

  const unavailableMessage = previewUnavailable
    ? "El recorrido vial estará disponible cuando exista una respuesta real del backend. La secuencia textual conserva el orden."
    : !configured
    ? "El mapa aún no está configurado en este entorno. La lista y el orden siguen disponibles."
    : "No hay ubicaciones válidas para mostrar. La lista y el orden siguen disponibles.";
  const directionsError = error ? directionsErrorState(error) : null;
  const hasMapCanvas = viewport.length > 0 && configured;
  const mapLoading = hasMapCanvas && state === "LOADING";
  const showLoadingOverlay = hasMapCanvas && (loading || mapLoading);
  return <section className={`route-sequence-map route-sequence-map--${variant}`} aria-label="Detalle vial de la ruta">
    {variant === "card" && <><h3>Mapa de ubicaciones</h3><p>{roadGeometry ? `Sigue las flechas sobre la línea azul: empieza en el punto ${firstSequence} y termina en el ${lastSequence}.` : loading ? "Los marcadores permanecen visibles mientras se recalcula el recorrido vial." : "Los marcadores siguen el orden actual. La línea aparecerá cuando el recorrido vial esté disponible."}</p></>}
    {roadGeometry && firstSequence !== undefined && lastSequence !== undefined && firstSequence !== lastSequence && <div className="route-sequence-map__direction-guide" role="note" aria-label={`Sentido del recorrido: comienza en el punto ${firstSequence} y termina en el punto ${lastSequence}.`}><div aria-hidden="true"><span className="route-sequence-map__direction-endpoint route-sequence-map__direction-endpoint--start"><i>{firstSequence}</i><strong>Inicio</strong></span><span className="route-sequence-map__direction-flow"><b>→ → →</b><small>{intermediateStops === 0 ? "Sin paradas intermedias" : `${intermediateStops} ${intermediateStops === 1 ? "parada intermedia" : "paradas intermedias"}`}</small></span><span className="route-sequence-map__direction-endpoint route-sequence-map__direction-endpoint--end"><i>{lastSequence}</i><strong>Final</strong></span></div></div>}
    {hasMapCanvas && <div className="route-sequence-map__canvas-wrapper" aria-busy={showLoadingOverlay}>
      <div ref={container} className="route-sequence-map__canvas" aria-label={roadGeometry ? "Mapa con recorrido vial de la ruta" : "Mapa de ubicaciones seleccionadas sin recorrido vial"} />
      {showLoadingOverlay && <ModalAsyncState className="route-sequence-map__loading-overlay" state="loading" title={loading ? "Cargando detalle vial" : "Cargando mapa"} message={loading ? "Estamos preparando el recorrido vial para el orden guardado." : "Estamos preparando la vista del mapa."} />}
    </div>}
    {loading && !hasMapCanvas && <ModalAsyncState state="loading" title="Cargando detalle vial" message="Estamos preparando el recorrido vial para el orden guardado." />}
    {stale && <p role="status">Propuesta ajustada manualmente. Las estimaciones están pendientes de actualización.</p>}
    {directionsError && <FormAlert><strong>{directionsError.title}</strong><p>{directionsError.message}</p>{directionsError.canRetry && retryDirections && <Button size="compact" onClick={retryDirections}>Reintentar detalle vial</Button>}</FormAlert>}
    {state === "ACTIVE" && !loading && !error && <p role="status">{roadGeometry ? "Detalle vial disponible." : "Puntos de visita disponibles."}</p>}
    {state === "LIMITED" && <ModalAsyncState state="error" title="No pudimos cargar el mapa" message="La lista y el orden siguen disponibles." primaryAction={{ label: "Reintentar mapa", onClick: () => setRetry((value) => value + 1) }} />}
    {(previewUnavailable || !configured || viewport.length === 0) && <p role="status">{unavailableMessage}</p>}
    {missingLocationNames.length > 0 && <div className="route-map-missing" role="status"><strong>{missingLocationNames.length} {missingLocationNames.length === 1 ? "cliente sin ubicación" : "clientes sin ubicación"}</strong><p>Permanecen en la lista y no bloquean el flujo.</p><ul>{missingLocationNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul></div>}
  </section>;
}
