import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RouteSequenceMap } from "./RouteSequenceMap";

const maplibreLoader = vi.hoisted(() => ({ deferred: false, resolve: undefined as (() => void) | undefined }));
const maps: Array<{ style: string; setStyle: ReturnType<typeof vi.fn>; listeners: Record<string, () => void>; getSource: ReturnType<typeof vi.fn>; addSource: ReturnType<typeof vi.fn>; addLayer: ReturnType<typeof vi.fn>; fitBounds: ReturnType<typeof vi.fn>; resize: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }> = [];
const markers: HTMLElement[] = [];
vi.mock("maplibre-gl", () => ({
  setWorkerUrl: vi.fn(),
  Map: class { readonly style: string; readonly sources = new Set<string>(); readonly setStyle = vi.fn(() => this.sources.clear()); readonly listeners: Record<string, () => void> = {}; readonly getSource = vi.fn((id: string) => this.sources.has(id) ? {} : undefined); readonly addSource = vi.fn((id: string) => this.sources.add(id)); readonly addLayer = vi.fn(); readonly fitBounds = vi.fn(); readonly resize = vi.fn(); readonly remove = vi.fn(); constructor({ style }: { style: string }) { this.style = style; maps.push(this); } on(event: string, listener: () => void) { this.listeners[event] = listener; } setMissingStyleImageResolver() {} hasImage() { return false; } addImage() {} },
  Marker: class { constructor({ element }: { element: HTMLElement }) { markers.push(element); } setLngLat() { return this; } addTo() { return this; } },
}));
vi.mock("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url", () => ({ default: "/assets/maplibre-worker.js" }));
vi.mock("../../company-clients/components/maplibre-loader", async () => ({ loadMapLibre: async () => {
  const maplibre = await import("maplibre-gl");
  if (!maplibreLoader.deferred) return maplibre;
  return new Promise<typeof maplibre>((resolve) => { maplibreLoader.resolve = () => resolve(maplibre); });
} }));
afterEach(() => { cleanup(); maps.splice(0); markers.splice(0); maplibreLoader.deferred = false; maplibreLoader.resolve = undefined; vi.unstubAllEnvs(); document.documentElement.dataset.theme = "light"; });

test("usa el estilo vial oscuro del proveedor y vuelve al claro al cambiar de tema", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  document.documentElement.dataset.theme = "dark";
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }]} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  expect(maps[0]?.style).toContain("/styles/dark-matter/");
  act(() => maps[0]?.listeners.load?.());
  act(() => { document.documentElement.dataset.theme = "light"; });
  await waitFor(() => expect(maps[0]?.setStyle).toHaveBeenCalledWith(expect.stringContaining("/styles/osm-bright/")));
  expect(maps).toHaveLength(1);
  expect(markers.map((marker) => marker.textContent)).toEqual(["1"]);
});

test("usa el tema vigente y prepara la capa vial si cambia durante la carga diferida", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  maplibreLoader.deferred = true;
  document.documentElement.dataset.theme = "dark";
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} directions={{ geometry: [{ latitude: -12.01, longitude: -77.01 }, { latitude: -12.02, longitude: -77.02 }], legs: [], distanceMeters: 1200, durationSeconds: 300 }} />);
  await waitFor(() => expect(maplibreLoader.resolve).toBeTypeOf("function"));
  act(() => { document.documentElement.dataset.theme = "light"; });
  act(() => maplibreLoader.resolve?.());
  await waitFor(() => expect(maps).toHaveLength(1));
  expect(maps[0]?.style).toContain("/styles/osm-bright/");
  act(() => maps[0]?.listeners["style.load"]?.());
  act(() => maps[0]?.listeners.load?.());
  expect(maps[0]?.addSource).toHaveBeenCalledOnce();
  expect(markers.map((marker) => marker.textContent)).toEqual(["1", "2"]);
});

test("explica que faltan ubicaciones y mantiene la lista como alternativa", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  render(<RouteSequenceMap points={[]} />);
  expect(screen.getByRole("status").textContent).toContain("mapa aún no está configurado");
});

test("explica que faltan ubicaciones aunque los mosaicos estén configurados", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte" }]} />);
  expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("No hay ubicaciones válidas"))).toBe(true);
  expect(screen.getByText("Norte")).toBeTruthy();
});

test("mantiene los marcadores válidos y enumera la visita sin ubicación", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sin ubicación" }]} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  expect(markers.map((marker) => marker.textContent)).toEqual(["1"]);
  expect(screen.getByText("1 cliente sin ubicación")).toBeTruthy();
  expect(screen.getByText("Sin ubicación")).toBeTruthy();
  expect(document.body.textContent).not.toContain("-12.04");
});

test("muestra marcadores numerados sin dibujar vectores cuando no existe detalle vial", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  expect(maps[0]?.addSource).not.toHaveBeenCalled(); expect(markers.map((marker) => marker.textContent)).toEqual(["1", "2"]); expect(document.body.textContent).not.toContain("-12.04");
  expect(maps[0]?.fitBounds).toHaveBeenCalledOnce();
  expect(screen.getByRole("heading", { name: "Mapa de ubicaciones" })).toBeTruthy();
});

test("renderiza la geometría vial recibida en lugar de la línea aproximada", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} directions={{ geometry: [{ latitude: -12.01, longitude: -77.01 }, { latitude: -12.02, longitude: -77.02 }, { latitude: -12.03, longitude: -77.03 }], legs: [], distanceMeters: 1200, durationSeconds: 300 }} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  expect(maps[0]?.addSource).toHaveBeenCalledWith("route-sequence", expect.objectContaining({ data: expect.objectContaining({ geometry: expect.objectContaining({ coordinates: [[-77.01, -12.01], [-77.02, -12.02], [-77.03, -12.03]] }) }) }));
  expect(maps[0]?.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: "route-sequence-line-casing", type: "line" }));
  expect(maps[0]?.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: "route-sequence-direction", type: "symbol", layout: expect.objectContaining({ "symbol-placement": "line", "text-field": "▶" }) }));
  expect(markers[0]?.classList.contains("route-sequence-map__marker--start")).toBe(true);
  expect(markers[1]?.classList.contains("route-sequence-map__marker--end")).toBe(true);
  expect(screen.getByRole("heading", { name: "Mapa de ubicaciones" })).toBeTruthy();
  expect(screen.getByText("Sigue las flechas sobre la línea azul: empieza en el punto 1 y termina en el 2.")).toBeTruthy();
  expect(screen.getByRole("note", { name: "Sentido del recorrido: comienza en el punto 1 y termina en el punto 2." })).toBeTruthy();
});

test("restaura la geometría vial cuando el nuevo estilo termina de cargar", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  document.documentElement.dataset.theme = "dark";
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} directions={{ geometry: [{ latitude: -12.01, longitude: -77.01 }, { latitude: -12.02, longitude: -77.02 }], legs: [], distanceMeters: 1200, durationSeconds: 300 }} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  act(() => { document.documentElement.dataset.theme = "light"; });
  await waitFor(() => expect(maps[0]?.setStyle).toHaveBeenCalled());
  act(() => maps[0]?.listeners["style.load"]?.());
  expect(maps[0]?.addSource).toHaveBeenCalledTimes(2);
  expect(markers.map((marker) => marker.textContent)).toEqual(["1", "2"]);
});

test("recalcula el mapa cuando el modal termina de asignar su tamaño", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }]} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  await waitFor(() => expect(maps[0]?.resize).toHaveBeenCalled());
});

test("ante 503 conserva las ubicaciones en una alerta inline y permite reintentar", () => {
  const retry = vi.fn();
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }]} error={{ status: 503, correlationId: null, fieldErrors: [] }} retry={retry} />);
  expect(screen.getByRole("alert").textContent).toContain("El detalle vial no está disponible");
  expect(screen.getByRole("alert").textContent).toContain("Las ubicaciones válidas permanecen visibles.");
  screen.getByRole("button", { name: "Reintentar detalle vial" }).click();
  expect(retry).toHaveBeenCalledOnce();
});

test("presenta la carga de Directions con el estado modal compartido", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} loading />);
  const status = screen.getByText("Cargando detalle vial").closest("section");
  expect(status?.getAttribute("aria-busy")).toBe("true");
  expect(status?.textContent).toContain("Cargando detalle vial");
  expect(status?.parentElement?.className).toContain("route-sequence-map__canvas-wrapper");
});

test("ante 422 muestra una alerta inline con reintento sin exponer datos de la ruta", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }]} error={{ status: 422, correlationId: "corr-directions", fieldErrors: [] }} retry={vi.fn()} />);
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("No pudimos calcular el recorrido vial.");
  screen.getByRole("button", { name: "Reintentar detalle vial" }).click();
  expect(alert.textContent).not.toContain("-12.04");
  expect(alert.textContent).not.toContain("-77.03");
});
