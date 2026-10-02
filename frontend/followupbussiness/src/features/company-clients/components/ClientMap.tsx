import { useEffect, useRef, useState } from "react";
import type { Client } from "../types";
import { loadMapLibre } from "./maplibre-loader";
import { handleMissingStyleImages } from "./map-style";
import { createMapMarker } from "./map-marker";
import { currentGeoapifyMapStyleUrl, useGeoapifyMapStyleUrl } from "../../../shared/maps/geoapify-map-theme";
type MapState = "LOADING" | "ACTIVE" | "LIMITED" | "DISABLED";

export function ClientMap({ clients, selectedId, onSelect, empty = false, focusVersion = 0 }: { clients: readonly Client[]; selectedId: string | null; onSelect: (clientId: string | null) => void; empty?: boolean; focusVersion?: number }) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<import("maplibre-gl").Map | null>(null); const mapStyleUrlRef = useRef<string | null>(null); const markersRef = useRef<import("maplibre-gl").Marker[]>([]); const selectRef = useRef(onSelect); const [state, setState] = useState<MapState>("DISABLED"); const [retry, setRetry] = useState(0); const key = import.meta.env.VITE_GEOAPIFY_TILE_KEY; const mapStyleUrl = useGeoapifyMapStyleUrl(key); const configured = Boolean(key);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { mapStyleUrlRef.current = mapStyleUrl; if (mapStyleUrl) mapRef.current?.setStyle(mapStyleUrl); }, [mapStyleUrl]);
  useEffect(() => {
    const initialMapStyleUrl = mapStyleUrlRef.current;
    if (!initialMapStyleUrl || !container.current) { setState("DISABLED"); return; }
    let disposed = false; setState("LOADING");
    void loadMapLibre().then(({ Map, Marker, Popup }) => {
      const latestMapStyleUrl = currentGeoapifyMapStyleUrl(key);
      mapStyleUrlRef.current = latestMapStyleUrl;
      if (disposed || !container.current || !latestMapStyleUrl) return;
      const selected = clients.find((client) => client.id === selectedId); const focus = selected?.location ?? clients[0]?.location; const instance = new Map({ container: container.current, center: focus ? [focus.longitude, focus.latitude] : [-77.0428, -12.0464], zoom: selected ? 15 : focus ? 11 : 9, style: latestMapStyleUrl }); mapRef.current = instance; handleMissingStyleImages(instance);
      clients.forEach((client) => { const element = createMapMarker({ interactive: true, status: client.status, selected: selectedId === client.id, ariaLabel: `Seleccionar ${client.name}, ${client.status === "ACTIVE" ? "Activo" : "Inactivo"}`, onClick: (event) => { event.stopPropagation(); selectRef.current(client.id); } }); markersRef.current.push(new Marker({ anchor: "bottom", element }).setLngLat([client.location.longitude, client.location.latitude]).addTo(instance)); });
      if (selected) new Popup({
        closeButton: false,
        closeOnClick: false,
        focusAfterOpen: false,
        maxWidth: "min(18rem, calc(100vw - 3rem))",
        offset: {
          center: [0, 0], bottom: [0, -6], top: [0, 6], left: [6, 0], right: [-6, 0],
          "bottom-left": [6, -6], "bottom-right": [-6, -6],
          "top-left": [6, 6], "top-right": [-6, 6],
        },
        className: "client-map__popup",
      }).setLngLat([selected.location.longitude, selected.location.latitude]).setDOMContent(popupContent(selected)).addTo(instance);
      instance.on("click", () => selectRef.current(null));
      instance.on("load", () => !disposed && setState("ACTIVE")); instance.on("error", () => !disposed && setState("LIMITED"));
    }).catch(() => !disposed && setState("LIMITED"));
    return () => { disposed = true; markersRef.current = []; mapRef.current?.remove(); mapRef.current = null; };
  }, [clients, focusVersion, retry, selectedId]);
  return <section className="client-map" aria-labelledby="client-map-title"><h2 id="client-map-title">Mapa de clientes</h2><p>Las ubicaciones se muestran como registradas. Verifica su vigencia antes de usarlas como referencia operativa.</p>{empty && <p className="client-map__empty" role="status">No encontramos clientes con estos filtros. El mapa permanece disponible para una nueva búsqueda.</p>}{configured && <div ref={container} className="client-map__canvas" aria-label="Mapa general de clientes" />}{configured && state === "LOADING" && <p role="status">Cargando mapa…</p>}{state === "ACTIVE" && <p className="client-map__attribution" role="status">Mapa activo. Incluye atribución del proveedor.</p>}{state === "LIMITED" && <section className="client-map__fallback" role="status"><p>No pudimos cargar los mosaicos del mapa. La lista de clientes sigue disponible.</p><button type="button" className="client-form__secondary" onClick={() => setRetry((value) => value + 1)}>Reintentar mapa</button></section>}{!configured && <p role="status">Mapa no disponible: faltan los mosaicos configurados. La lista de clientes sigue disponible.</p>}</section>;
}

function popupContent(client: Client) {
  const card = document.createElement("article"); card.dataset.clientMapSelection = "true";
  card.className = "client-map__popup-body";
  const name = document.createElement("strong"); name.textContent = client.name;
  const details = document.createElement("p"); details.className = "client-map__popup-segment"; details.textContent = client.segment ?? "Sin segmento";
  const status = document.createElement("span"); status.className = `client-map__popup-status client-map__popup-status--${client.status.toLowerCase()}`; status.textContent = client.status === "ACTIVE" ? "Activo" : "Inactivo";
  card.append(name, details, status); return card;
}
