import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ClientMap } from "./ClientMap";

const maps: Array<{ listeners: Record<string, () => void>; remove: ReturnType<typeof vi.fn> }> = [];
const markers: HTMLElement[] = [];
const popups: HTMLElement[] = [];
vi.mock("maplibre-gl", () => ({
  setWorkerUrl: vi.fn(),
  Map: class { readonly listeners: Record<string, () => void> = {}; readonly remove = vi.fn(); constructor() { maps.push(this); } on(event: string, listener: () => void) { this.listeners[event] = listener; } setMissingStyleImageResolver() {} },
  Marker: class { constructor({ element }: { element: HTMLElement }) { markers.push(element); } setLngLat() { return this; } addTo() { return this; } },
  Popup: class { setLngLat() { return this; } setDOMContent(content: HTMLElement) { popups.push(content); return this; } addTo() { return this; } },
}));
vi.mock("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url", () => ({ default: "/assets/maplibre-worker.js" }));
const clients = [{ id: "client-1", name: "Comercial Norte", segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE" as const, location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 }];
afterEach(() => { cleanup(); maps.splice(0); markers.splice(0); popups.splice(0); vi.unstubAllEnvs(); });

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
  fireEvent.click(marker as Element);
  expect(onSelect).toHaveBeenCalledWith("client-1");
  act(() => maps[0]?.listeners.click?.());
  expect(onSelect).toHaveBeenLastCalledWith(null);
  act(() => maps[0]?.listeners.load?.());
  expect(screen.getByRole("status").textContent).toContain("Incluye atribución");
});

test("muestra datos básicos encima del cliente seleccionado", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  render(<ClientMap clients={[{ ...clients[0]!, segment: "Mayorista" }]} selectedId="client-1" onSelect={() => undefined} />);
  await waitFor(() => expect(popups).toHaveLength(1));
  expect(popups[0]?.textContent).toContain("Comercial Norte");
  expect(popups[0]?.textContent).toContain("Mayorista");
  expect(popups[0]?.textContent).toContain("Activo");
});

test("libera la instancia de mapa al desmontarse para no conservar el contexto anterior", async () => {
  vi.stubEnv("VITE_GEOAPIFY_TILE_KEY", "test-key");
  const view = render(<ClientMap clients={clients} selectedId={null} onSelect={() => undefined} />);
  await waitFor(() => expect(maps).toHaveLength(1));

  view.unmount();

  expect(maps[0]?.remove).toHaveBeenCalledOnce();
});
