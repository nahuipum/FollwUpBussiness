import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { handleMissingStyleImages } from "./map-style";

type MapState = "LOADING" | "ACTIVE" | "LIMITED" | "DISABLED";
const DEFAULT_LIMA_POINT = { latitude: -12.0464, longitude: -77.0428 } as const;

export function ClientLocationMap({
  latitude,
  longitude,
  onConfirm,
  readOnly = false,
}: {
  latitude: number | null;
  longitude: number | null;
  onConfirm?: (point: { latitude: number; longitude: number }) => void;
  readOnly?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import("maplibre-gl").Map | null>(null);
  const marker = useRef<import("maplibre-gl").Marker | null>(null);
  const confirmRef = useRef(onConfirm);
  const pointRef = useRef({ latitude: latitude ?? DEFAULT_LIMA_POINT.latitude, longitude: longitude ?? DEFAULT_LIMA_POINT.longitude });
  const [state, setState] = useState<MapState>("DISABLED");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    confirmRef.current = onConfirm;
  }, [onConfirm]);

  const configured = Boolean(import.meta.env.VITE_GEOAPIFY_TILE_KEY);
  const selected = latitude !== null && longitude !== null;
  useEffect(() => {
    const key = import.meta.env.VITE_GEOAPIFY_TILE_KEY;
    if (!key || !container.current) {
      setState("DISABLED");
      return;
    }

    let disposed = false;
    setState("LOADING");
    void Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    ])
      .then(([{ Map, Marker, setWorkerUrl }, { default: workerUrl }]) => {
        if (disposed || !container.current) return;
        setWorkerUrl(workerUrl);
        const initialPoint = pointRef.current;
        const instance = new Map({
          container: container.current,
          center: [initialPoint.longitude, initialPoint.latitude],
          zoom: 13,
          style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${encodeURIComponent(key)}`,
        });
        map.current = instance;
        handleMissingStyleImages(instance);
        const markerElement = document.createElement("span");
        markerElement.className = "client-location-map__marker";
        markerElement.setAttribute("aria-hidden", "true");
        const markerInstance = new Marker({ draggable: !readOnly, element: markerElement })
          .setLngLat([initialPoint.longitude, initialPoint.latitude])
          .addTo(instance);
        marker.current = markerInstance;
        if (!readOnly) {
          markerInstance.on("dragend", () => {
            const point = markerInstance.getLngLat();
            confirmRef.current?.({ latitude: point.lat, longitude: point.lng });
          });
          instance.on("click", (event) => {
            markerInstance.setLngLat(event.lngLat);
            confirmRef.current?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
          });
        }
        instance.on("load", () => !disposed && setState("ACTIVE"));
        instance.on("error", () => !disposed && setState("LIMITED"));
      })
      .catch(() => !disposed && setState("LIMITED"));

    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [readOnly, retry]);

  useEffect(() => {
    const point = {
      latitude: latitude ?? DEFAULT_LIMA_POINT.latitude,
      longitude: longitude ?? DEFAULT_LIMA_POINT.longitude,
    };
    pointRef.current = point;
    marker.current?.setLngLat([point.longitude, point.latitude]);
  }, [latitude, longitude]);

  return (
    <section className={`client-form__map${readOnly ? " client-location-map--readonly" : ""}`} aria-labelledby="client-location-map-title">
      <h3 id="client-location-map-title">{readOnly ? "Ubicación del cliente" : "Seleccionar ubicación"}</h3>
      <p>{readOnly ? "Mueve o acerca el mapa para explorar los alrededores. El punto guardado no puede modificarse desde esta vista." : selected ? "Arrastra el marcador o haz clic en el mapa para ajustar el punto." : "El mapa inicia en Lima como referencia. Arrastra el marcador, haz clic en el mapa o ingresa coordenadas para elegir un punto."}</p>
      {configured && <div ref={container} className="client-form__map-canvas" aria-label={readOnly ? "Mapa de ubicación del cliente" : "Mapa para confirmar ubicación"} />}
      {configured && state === "LOADING" && <p role="status">Cargando mapa…</p>}
      {state === "ACTIVE" && <p role="status">{readOnly ? "Mapa disponible en modo consulta." : "Mapa activo. Incluye atribución del proveedor."}</p>}
      {configured && state === "LIMITED" && (
        <FormAlert>
          <p>{readOnly ? "No pudimos cargar el mapa. Intenta nuevamente para consultar la ubicación registrada." : "No pudimos cargar los mosaicos del mapa. Conserva o ingresa las coordenadas manualmente."}</p>
          <button className="client-form__secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar mapa</button>
        </FormAlert>
      )}
      {!configured && <p role="status">{readOnly ? "Mapa no disponible: faltan los mosaicos configurados." : "Mapa deshabilitado: falta configurar los mosaicos. Usa las coordenadas manuales."}</p>}
    </section>
  );
}
