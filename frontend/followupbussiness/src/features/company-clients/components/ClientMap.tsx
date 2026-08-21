import { useEffect, useRef, useState } from "react";
import type { Client } from "../types";
import { handleMissingStyleImages } from "./map-style";
type MapState = "LOADING" | "ACTIVE" | "LIMITED" | "DISABLED";

export function ClientMap({ clients, selectedId, onSelect, empty = false, focusVersion = 0 }: { clients: readonly Client[]; selectedId: string | null; onSelect: (clientId: string | null) => void; empty?: boolean; focusVersion?: number }) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<import("maplibre-gl").Map | null>(null); const markersRef = useRef<import("maplibre-gl").Marker[]>([]); const selectRef = useRef(onSelect); const [state, setState] = useState<MapState>("DISABLED"); const [retry, setRetry] = useState(0); const configured = Boolean(import.meta.env.VITE_GEOAPIFY_TILE_KEY);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    const key = import.meta.env.VITE_GEOAPIFY_TILE_KEY;
    if (!key || !container.current) { setState("DISABLED"); return; }
    let disposed = false; setState("LOADING");
    void Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url")]).then(([{ Map, Marker, Popup, setWorkerUrl }, { default: workerUrl }]) => {
      if (disposed || !container.current) return;
      setWorkerUrl(workerUrl); const selected = clients.find((client) => client.id === selectedId); const focus = selected?.location ?? clients[0]?.location; const instance = new Map({ container: container.current, center: focus ? [focus.longitude, focus.latitude] : [-77.0428, -12.0464], zoom: selected ? 15 : focus ? 11 : 9, style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${encodeURIComponent(key)}` }); mapRef.current = instance; handleMissingStyleImages(instance);
      clients.forEach((client) => { const element = document.createElement("button"); element.type = "button"; element.dataset.clientMapSelection = "true"; element.className = `client-map__marker client-map__marker--${client.status.toLowerCase()}${selectedId === client.id ? " client-map__marker--selected" : ""}`; element.setAttribute("aria-label", `Seleccionar ${client.name}`); element.addEventListener("click", (event) => { event.stopPropagation(); selectRef.current(client.id); }); markersRef.current.push(new Marker({ element }).setLngLat([client.location.longitude, client.location.latitude]).addTo(instance)); });
      if (selected) new Popup({ anchor: "bottom", closeButton: false, closeOnClick: false, offset: 12, className: "client-map__popup" }).setLngLat([selected.location.longitude, selected.location.latitude]).setDOMContent(popupContent(selected)).addTo(instance);
      instance.on("click", () => selectRef.current(null));
      instance.on("load", () => !disposed && setState("ACTIVE")); instance.on("error", () => !disposed && setState("LIMITED"));
    }).catch(() => !disposed && setState("LIMITED"));
    return () => { disposed = true; markersRef.current = []; mapRef.current?.remove(); mapRef.current = null; };
  }, [clients, focusVersion, retry, selectedId]);
  return <section className="client-map" aria-labelledby="client-map-title"><h2 id="client-map-title">Mapa de clientes</h2><p>Las ubicaciones se muestran como registradas. Verifica su vigencia antes de usarlas como referencia operativa.</p>{empty && <p className="client-map__empty" role="status">No encontramos clientes con estos filtros. El mapa permanece disponible para una nueva búsqueda.</p>}{configured && <div ref={container} className="client-map__canvas" aria-label="Mapa general de clientes" />}{configured && state === "LOADING" && <p role="status">Cargando mapa…</p>}{state === "ACTIVE" && <p className="client-map__attribution" role="status">Mapa activo. Incluye atribución del proveedor.</p>}{state === "LIMITED" && <section className="client-map__fallback" role="status"><p>No pudimos cargar los mosaicos del mapa. La lista de clientes sigue disponible.</p><button type="button" className="client-form__secondary" onClick={() => setRetry((value) => value + 1)}>Reintentar mapa</button></section>}{!configured && <p role="status">Mapa no disponible: faltan los mosaicos configurados. La lista de clientes sigue disponible.</p>}</section>;
}

function popupContent(client: Client) {
  const card = document.createElement("article"); card.dataset.clientMapSelection = "true";
  const name = document.createElement("strong"); name.textContent = client.name;
  const details = document.createElement("p"); details.textContent = client.segment ?? "Sin segmento";
  const status = document.createElement("span"); status.className = `client-map__popup-status client-map__popup-status--${client.status.toLowerCase()}`; status.textContent = client.status === "ACTIVE" ? "Activo" : "Inactivo";
  card.append(name, details, status); return card;
}
