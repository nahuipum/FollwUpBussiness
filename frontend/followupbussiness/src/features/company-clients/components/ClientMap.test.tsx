import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ClientMap } from "./ClientMap";

const maplibreLoader = vi.hoisted(() => ({ deferred: false, resolve: undefined as (() => void) | undefined }));
const maps: Array<{ style: string; setStyle: ReturnType<typeof vi.fn>; listeners: Record<string, () => void>; remove: ReturnType<typeof vi.fn> }> = [];
const markers: HTMLElement[] = [];
const popups: HTMLElement[] = [];
const popupOptions: Array<Record<string, unknown>> = [];
vi.mock("maplibre-gl", () => ({
  setWorkerUrl: vi.fn(),
  Map: class { readonly style: string; readonly setStyle = vi.fn(); readonly listeners: Record<string, () => void> = {}; readonly remove = vi.fn(); constructor({ style }: { style: string }) { this.style = style; maps.push(this); } on(event: string, listener: () => void) { this.listeners[event] = listener; } setMissingStyleImageResolver() {} },
  Marker: class { constructor({ element }: { element: HTMLElement }) { markers.push(element); } setLngLat() { return this; } addTo() { return this; } },
  Popup: class { constructor(options: Record<string, unknown>) { popupOptions.push(options); } setLngLat() { return this; } setDOMContent(content: HTMLElement) { popups.push(content); return this; } addTo() { return this; } },
}));
vi.mock("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url", () => ({ default: "/assets/maplibre-worker.js" }));
vi.mock("./maplibre-loader", async () => ({ loadMapLibre: async () => {
  const maplibre = await import("maplibre-gl");
  if (!maplibreLoader.deferred) return maplibre;
  return new Promise<typeof maplibre>((resolve) => { maplibreLoader.resolve = () => resolve(maplibre); });
} }));
const clients = [{ id: "client-1", name: "Comercial Norte", segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE" as const, location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 }];
afterEach(() => { cleanup(); maps.splice(0); markers.splice(0); popups.splice(0); popupOptions.splice(0); maplibreLoader.deferred = false; maplibreLoader.resolve = undefined; vi.unstubAllEnvs(); document.documentElement.dataset.theme = "light"; });

test("usa el estilo oscuro y lo actualiza al cambiar el tema", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  document.documentElement.dataset.theme = "dark";
  render(<ClientMap clients={clients} selectedId={null} onSelect={() => undefined} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  expect(maps[0]?.style).toContain("/styles/dark-matter/");

  act(() => { document.documentElement.dataset.theme = "light"; });
  await waitFor(() => expect(maps[0]?.setStyle).toHaveBeenCalledWith(expect.stringContaining("/styles/osm-bright/")));
  expect(maps).toHaveLength(1);
});

test("usa el tema vigente si cambia antes de resolver la carga diferida", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  maplibreLoader.deferred = true;
  document.documentElement.dataset.theme = "dark";
  render(<ClientMap clients={clients} selectedId={null} onSelect={() => undefined} />);
  await waitFor(() => expect(maplibreLoader.resolve).toBeTypeOf("function"));
  act(() => { document.documentElement.dataset.theme = "light"; });
  act(() => maplibreLoader.resolve?.());
  await waitFor(() => expect(maps).toHaveLength(1));
  expect(maps[0]?.style).toContain("/styles/osm-bright/");
});

test("se degrada a la lista cuando falta la configuración de mosaicos", () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "");
  render(<ClientMap clients={clients} selectedId={null} onSelect={() => undefined} />);
  expect(screen.getByRole("status").textContent).toContain("lista de clientes sigue disponible");
  expect(screen.queryByLabelText("Mapa general de clientes")).toBeNull();
});

test("mantiene mapa y comunica filtros sin resultados", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<ClientMap clients={[]} selectedId={null} empty onSelect={() => undefined} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  expect(screen.getByLabelText("Mapa general de clientes")).toBeTruthy();
  expect(screen.getByText(/No encontramos clientes con estos filtros/)).toBeTruthy();
});

test("distingue marcador, acerca selección y limpia al tocar mapa", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  const onSelect = vi.fn();
  render(<ClientMap clients={clients} selectedId={null} onSelect={onSelect} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  const marker = markers[0];
  expect(marker).toBeTruthy();
  expect(marker?.className).toContain("map-marker--active");
  expect(marker?.getAttribute("aria-label")).toBe("Seleccionar Comercial Norte, Activo");
  expect(marker?.getAttribute("aria-pressed")).toBe("false");
  fireEvent.focus(marker as Element);
  expect(marker?.className).toContain("map-marker--focus");
  fireEvent.click(marker as Element);
  expect(onSelect).toHaveBeenCalledWith("client-1");
  act(() => maps[0]?.listeners.click?.());
  expect(onSelect).toHaveBeenLastCalledWith(null);
  act(() => maps[0]?.listeners.load?.());
  expect(screen.getByRole("status").textContent).toContain("Incluye atribución");
});

test("expone el estado inactivo y permite reintentar tras un error del proveedor", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<ClientMap clients={[{ ...clients[0]!, status: "INACTIVE" }]} selectedId="client-1" onSelect={() => undefined} />);
  await waitFor(() => expect(maps).toHaveLength(1));
  expect(markers[0]?.getAttribute("aria-label")).toBe("Seleccionar Comercial Norte, Inactivo");
  expect(markers[0]?.getAttribute("aria-pressed")).toBe("true");
  expect(markers[0]?.className).toContain("map-marker--inactive");
  expect(markers[0]?.className).toContain("map-marker--selected");
  act(() => maps[0]?.listeners.error?.());
  fireEvent.click(screen.getByRole("button", { name: "Reintentar mapa" }));
  await waitFor(() => expect(maps).toHaveLength(2));
});

test("muestra un popup seguro, legible y no intrusivo para el cliente seleccionado", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  const longName = "Comercial del corredor norte con una denominación especialmente extensa";
  render(<ClientMap clients={[{ ...clients[0]!, name: longName, segment: "Mayorista <img src=x>" }]} selectedId="client-1" onSelect={() => undefined} />);
  await waitFor(() => expect(popups).toHaveLength(1));
  expect(popups[0]?.textContent).toContain(longName);
  expect(popups[0]?.textContent).toContain("Mayorista <img src=x>");
  expect(popups[0]?.textContent).toContain("Activo");
  expect(popups[0]?.querySelector("img")).toBeNull();
  expect(popups[0]?.className).toBe("client-map__popup-body");
  expect(popupOptions[0]).toMatchObject({ closeButton: false, closeOnClick: false, focusAfterOpen: false, maxWidth: "min(18rem, calc(100vw - 3rem))" });
  expect(popupOptions[0]?.anchor).toBeUndefined();
  expect(popupOptions[0]?.offset).toMatchObject({ bottom: [0, -6], top: [0, 6], left: [6, 0], right: [-6, 0] });
});

test("libera la instancia de mapa al desmontarse para no conservar el contexto anterior", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  const view = render(<ClientMap clients={clients} selectedId={null} onSelect={() => undefined} />);
  await waitFor(() => expect(maps).toHaveLength(1));

  view.unmount();

  expect(maps[0]?.remove).toHaveBeenCalledOnce();
});
