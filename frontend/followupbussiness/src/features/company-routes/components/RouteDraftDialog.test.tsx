import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RouteDraftDialog } from "./RouteDraftDialog";

const base = { sellers: [{ id: "seller-1", label: "Ana" }], date: "2026-08-26", sellerId: "seller-1", customers: [{ id: "customer-1", label: "Comercial Norte", suggested: false }], selected: ["customer-1"], loadingCustomers: false, moreCustomers: false, suggestionError: null, saving: false, draft: null, error: null, conflict: false, announcement: "", onDate: vi.fn(), onSeller: vi.fn(), onSelected: vi.fn(), onSubmit: vi.fn(), onMove: vi.fn(), onMoveTo: vi.fn(), onSaveOrder: vi.fn(), onLoadMore: vi.fn(), onRetrySuggestions: vi.fn(), onRetryCustomers: vi.fn(), onClose: vi.fn() };
afterEach(cleanup);
test("crea solo con selección autorizada y no expone datos privados", () => {
  render(<RouteDraftDialog {...base} />);
  expect(screen.getByText("Fecha programada de la ruta")).toBeTruthy(); expect(screen.getByText("Elige el día en que el vendedor realizará las visitas.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));
  expect(base.onSubmit).toHaveBeenCalledOnce(); expect(screen.queryByText("customer-1")).toBeNull();
});
test("usa el límite de 50 y permite reintentar la cartera", () => {
  render(<RouteDraftDialog {...base} selected={Array.from({ length: 50 }, (_, index) => `customer-${index}`)} error={{ status: 500, correlationId: null, fieldErrors: [] }} />);
  expect(screen.getByText("50 de 50 clientes seleccionados.")).toBeTruthy(); fireEvent.click(screen.getByRole("button", { name: "Reintentar cartera" })); expect(base.onRetryCustomers).toHaveBeenCalledOnce();
});
test("deshabilita un cliente adicional al alcanzar 50 sin quitar los existentes", () => {
  const customers = Array.from({ length: 51 }, (_, index) => ({ id: `customer-${index}`, label: `Cliente ${index}`, suggested: false })); const selected = customers.slice(0, 50).map((customer) => customer.id);
  render(<RouteDraftDialog {...base} customers={customers} selected={selected} />); fireEvent.click(screen.getAllByRole("button", { name: "Clientes de la ruta" }).at(-1)!); expect(screen.getByText(/Máximo de 50 clientes seleccionado/)).toBeTruthy(); expect(screen.getByRole("checkbox", { name: "Cliente 50" }).hasAttribute("disabled")).toBe(true); expect(screen.getByRole("checkbox", { name: "Cliente 0" }).hasAttribute("disabled")).toBe(false);
});
test("anuncia el reordenamiento y provee controles de teclado mediante botones", () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", sequence: 1, customerName: "Norte" }, { routePointId: "opaque-2", sequence: 2, customerName: "Sur" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  render(<RouteDraftDialog {...base} draft={draft} announcement="Punto movido a la posición 2." />);
  expect(screen.getAllByRole("status")[0]?.textContent).toContain("posición 2"); const down = screen.getByRole("button", { name: "Bajar Norte" }); expect(down.textContent).toBe(""); expect(down.querySelector("svg")).toBeTruthy(); fireEvent.click(down); expect(base.onMove).toHaveBeenCalledWith(0, 1); expect(screen.queryByText("opaque-1")).toBeNull();
});
test("ofrece un controlador para reordenar y conserva el mapa degradado sin coordenadas visibles", () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", sequence: 1, customerName: "Norte" }, { routePointId: "opaque-2", sequence: 2, customerName: "Sur" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  render(<RouteDraftDialog {...base} draft={draft} />);
  expect(screen.getByText(/No es navegación por calles/)).toBeTruthy(); expect(screen.getAllByRole("status").at(-1)?.textContent).toContain("lista y el orden siguen disponibles");
  expect(screen.getByText(/Arrastra una visita por el controlador/)).toBeTruthy(); expect(screen.getByRole("button", { name: "Reordenar Norte" })).toBeTruthy(); expect(screen.queryByText("opaque-1")).toBeNull();
});
test("informa y permite reintentar sugerencias sin ocultar la cartera", () => {
  render(<RouteDraftDialog {...base} suggestionError={{ status: 500, correlationId: null, fieldErrors: [] }} />);
  expect(screen.getByText(/Tu cartera sigue disponible/)).toBeTruthy(); expect(screen.getAllByText("Comercial Norte").length).toBeGreaterThan(0); fireEvent.click(screen.getByRole("button", { name: "Reintentar sugerencias" })); expect(base.onRetrySuggestions).toHaveBeenCalledOnce();
});
