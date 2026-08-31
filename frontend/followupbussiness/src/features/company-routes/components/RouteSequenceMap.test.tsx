import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RouteSequenceMap } from "./RouteSequenceMap";

const maps: Array<{ listeners: Record<string, () => void>; addSource: ReturnType<typeof vi.fn>; addLayer: ReturnType<typeof vi.fn>; resize: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }> = [];
const markers: HTMLElement[] = [];
vi.mock("maplibre-gl", () => ({
  setWorkerUrl: vi.fn(),
  Map: class { readonly listeners: Record<string, () => void> = {}; readonly addSource = vi.fn(); readonly addLayer = vi.fn(); readonly resize = vi.fn(); readonly remove = vi.fn(); constructor() { maps.push(this); } on(event: string, listener: () => void) { this.listeners[event] = listener; } setMissingStyleImageResolver() {} hasImage() { return false; } addImage() {} },
  Marker: class { constructor({ element }: { element: HTMLElement }) { markers.push(element); } setLngLat() { return this; } addTo() { return this; } },
}));
vi.mock("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url", () => ({ default: "/assets/maplibre-worker.js" }));
afterEach(() => { cleanup(); maps.splice(0); markers.splice(0); vi.unstubAllEnvs(); });

test("explica que faltan ubicaciones y mantiene la lista como alternativa", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  render(<RouteSequenceMap points={[]} />);
  expect(screen.getByRole("status").textContent).toContain("mapa aún no está configurado");
});

test("explica que faltan ubicaciones aunque los mosaicos estén configurados", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte" }]} />);
  expect(screen.getByRole("status").textContent).toContain("no tiene ubicaciones de clientes suficientes");
});

test("muestra marcadores numerados sin dibujar vectores cuando no existe detalle vial", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  expect(maps[0]?.addSource).not.toHaveBeenCalled(); expect(markers.map((marker) => marker.textContent)).toEqual(["1", "2"]); expect(document.body.textContent).not.toContain("-12.04");
});

test("renderiza la geometría vial recibida en lugar de la línea aproximada", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }, { sequence: 2, customerName: "Sur", location: { latitude: -12.05, longitude: -77.04 } }]} directions={{ geometry: [{ latitude: -12.01, longitude: -77.01 }, { latitude: -12.02, longitude: -77.02 }, { latitude: -12.03, longitude: -77.03 }], legs: [], distanceMeters: 1200, durationSeconds: 300 }} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  expect(maps[0]?.addSource).toHaveBeenCalledWith("route-sequence", expect.objectContaining({ data: expect.objectContaining({ geometry: expect.objectContaining({ coordinates: [[-77.01, -12.01], [-77.02, -12.02], [-77.03, -12.03]] }) }) }));
  expect(screen.getByText("Detalle vial")).toBeTruthy();
});

test("recalcula el mapa cuando el modal termina de asignar su tamaño", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }]} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  act(() => maps[0]?.listeners.load?.());
  await waitFor(() => expect(maps[0]?.resize).toHaveBeenCalled());
});

test("ante 503 muestra el respaldo aproximado en una alerta inline y permite reintentar", () => {
  const retry = vi.fn();
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<RouteSequenceMap points={[{ sequence: 1, customerName: "Norte", location: { latitude: -12.04, longitude: -77.03 } }]} error={{ status: 503, correlationId: null, fieldErrors: [] }} retry={retry} />);
  expect(screen.getByRole("alert").textContent).toContain("El detalle vial no está disponible");
  expect(screen.getByRole("alert").textContent).toContain("Mostramos una secuencia aproximada, no navegación.");
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
  expect(alert.textContent).toContain("No pudimos calcular el recorrido vial con las visitas de esta ruta.");
  screen.getByRole("button", { name: "Reintentar detalle vial" }).click();
  expect(alert.textContent).not.toContain("-12.04");
  expect(alert.textContent).not.toContain("-77.03");
});
