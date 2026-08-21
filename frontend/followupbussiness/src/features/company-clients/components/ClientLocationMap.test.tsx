import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ClientLocationMap } from "./ClientLocationMap";

type Listener = (event?: { lngLat: { lat: number; lng: number } }) => void;
type MarkerInstance = {
  listeners: Record<string, () => void>;
  setLngLat: ReturnType<typeof vi.fn>;
  getLngLat: ReturnType<typeof vi.fn>;
  draggable: boolean;
};
const maps: Array<{ listeners: Record<string, Listener>; remove: ReturnType<typeof vi.fn>; center: [number, number]; zoom: number }> = [];
const markers: MarkerInstance[] = [];
const state = vi.hoisted(() => ({ setWorkerUrl: vi.fn() }));

vi.mock("maplibre-gl", () => ({
  setWorkerUrl: state.setWorkerUrl,
  Map: class {
    readonly listeners: Record<string, Listener> = {};
    readonly remove = vi.fn();
    readonly center: [number, number];
    readonly zoom: number;
    constructor(options: { center: [number, number]; zoom: number }) { this.center = options.center; this.zoom = options.zoom; maps.push(this); }
    on(event: string, listener: Listener) { this.listeners[event] = listener; }
    setMissingStyleImageResolver() {}
  },
  Marker: class {
    readonly listeners: Record<string, () => void> = {};
    readonly setLngLat = vi.fn().mockReturnThis();
    readonly getLngLat = vi.fn(() => ({ lat: -12.2, lng: -77.2 }));
    readonly draggable: boolean;
    constructor(options: { draggable: boolean }) { this.draggable = options.draggable; markers.push(this); }
    addTo() { return this; }
    on(event: string, listener: () => void) { this.listeners[event] = listener; return this; }
  },
}));
vi.mock("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url", () => ({ default: "/assets/maplibre-worker.js" }));

afterEach(() => { document.body.replaceChildren(); maps.splice(0); markers.splice(0); state.setWorkerUrl.mockReset(); vi.unstubAllEnvs(); });

test("activa el mapa tras load, limita tras error y permite reintentar sin red", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<ClientLocationMap latitude={-12.04} longitude={-77.03} onConfirm={() => undefined} />);

  await waitFor(() => expect(maps).toHaveLength(1));
  const firstMap = maps.at(0);
  if (!firstMap) throw new Error("MapLibre no se inicializó");
  expect(state.setWorkerUrl).toHaveBeenCalledWith("/assets/maplibre-worker.js");
  expect(screen.getByRole("status").textContent).toContain("Cargando mapa");
  expect(screen.queryByRole("alert")).toBeNull();
  act(() => firstMap.listeners.load?.());
  expect(screen.getByRole("status").textContent).toContain("Mapa activo");

  act(() => firstMap.listeners.error?.());
  expect(screen.getByRole("alert").textContent).toContain("No pudimos cargar los mosaicos");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar mapa" }));
  await waitFor(() => expect(maps).toHaveLength(2));
});

test("queda deshabilitado sin clave y conserva la alternativa manual", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  render(<ClientLocationMap latitude={-12.04} longitude={-77.03} onConfirm={() => undefined} />);
  expect(screen.getByRole("status").textContent).toContain("Mapa deshabilitado");
  expect(maps).toHaveLength(0);
});

test("usa Lima solo como referencia y permite elegir el punto en el mapa", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  const onConfirm = vi.fn();
  render(<ClientLocationMap latitude={null} longitude={null} onConfirm={onConfirm} />);

  await waitFor(() => expect(maps).toHaveLength(1));
  expect(maps[0]?.center).toEqual([-77.0428, -12.0464]);
  expect(screen.getByText(/inicia en Lima como referencia/)).toBeTruthy();

  act(() => maps[0]?.listeners.click?.({ lngLat: { lat: -12.1, lng: -77.1 } }));
  expect(onConfirm).toHaveBeenCalledWith({ latitude: -12.1, longitude: -77.1 });
});

test("conserva la instancia y el viewport al sincronizar selecciones del mapa o captura manual", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  const onConfirm = vi.fn();
  const view = render(<ClientLocationMap latitude={null} longitude={null} onConfirm={onConfirm} />);

  await waitFor(() => expect(maps).toHaveLength(1));
  const firstMap = maps[0];
  const firstMarker = markers[0];
  if (!firstMap || !firstMarker) throw new Error("MapLibre no se inicializó");
  const initialCenter = firstMap.center;
  const initialZoom = firstMap.zoom;

  act(() => firstMap.listeners.click?.({ lngLat: { lat: -12.1, lng: -77.1 } }));
  view.rerender(<ClientLocationMap latitude={-12.1} longitude={-77.1} onConfirm={onConfirm} />);
  expect(maps).toHaveLength(1);
  expect(firstMap.center).toEqual(initialCenter);
  expect(firstMap.zoom).toBe(initialZoom);
  expect(firstMarker.setLngLat).toHaveBeenLastCalledWith([-77.1, -12.1]);

  act(() => firstMarker.listeners.dragend?.());
  view.rerender(<ClientLocationMap latitude={-12.2} longitude={-77.2} onConfirm={onConfirm} />);
  expect(onConfirm).toHaveBeenCalledWith({ latitude: -12.2, longitude: -77.2 });
  expect(maps).toHaveLength(1);
  expect(firstMap.center).toEqual(initialCenter);
  expect(firstMap.zoom).toBe(initialZoom);
  expect(firstMarker.setLngLat).toHaveBeenLastCalledWith([-77.2, -12.2]);
});

test("permite explorar el mapa de detalle sin modificar el punto guardado", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<ClientLocationMap latitude={-12.0686} longitude={-77.1082} readOnly />);

  await waitFor(() => expect(maps).toHaveLength(1));
  expect(markers[0]?.draggable).toBe(false);
  expect(markers[0]?.listeners.dragend).toBeUndefined();
  expect(maps[0]?.listeners.click).toBeUndefined();
  expect(screen.getByText(/Mueve o acerca el mapa/)).toBeTruthy();
  expect(screen.queryByText(/Coordenadas:/)).toBeNull();
  expect(screen.getByLabelText("Mapa de ubicación del cliente")).toBeTruthy();
});
