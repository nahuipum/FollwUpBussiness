import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RouteWorkspace } from "./RouteWorkspace";
import type { Route } from "../types";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));
vi.mock("./RouteSequenceMap", () => ({ RouteSequenceMap: ({ points, variant }: { points: readonly Route["points"][number][]; variant?: string }) => <div data-testid="route-map" data-variant={variant}>{points[0]?.customerName}</div> }));

const route = (status: Route["status"]): Route => ({ id: `route-${status}`, name: `Ruta ${status}`, date: "2026-09-10", sellerId: "seller-1", status, points: [{ routePointId: "point-1", sequence: 1, customerName: "Cliente" }], updatedAt: "2026-09-10T10:00:00Z", version: 3 });
const props = { sellers: [{ id: "seller-1", label: "Ana", status: "ACTIVE" as const, territoryIds: [] }], page: 0, pageSize: 5 as const, totalPages: 1, totalElements: 1, canManage: true, onDetail: vi.fn(), onOrder: vi.fn(), onProposal: vi.fn(), onPublish: vi.fn(), onPageChange: vi.fn() };
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test("ofrece edición directa, propuesta y publicación para DRAFT", () => {
  const draft = route("DRAFT");
  render(<RouteWorkspace {...props} routes={[draft]} />);
  fireEvent.click(screen.getByRole("button", { name: /Acciones de Ruta DRAFT/ }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Editar orden" }));
  expect(props.onOrder).toHaveBeenCalledWith(draft);
  fireEvent.click(screen.getByRole("button", { name: /Acciones de Ruta DRAFT/ }));
  expect(screen.getByRole("menuitem", { name: "Generar propuesta" })).toBeTruthy();
  expect(screen.getByRole("menuitem", { name: "Publicar ruta" })).toBeTruthy();
});

test("PUBLISHED sólo permite intentar editar orden y los estados finales son lectura", () => {
  const published = route("PUBLISHED");
  const completed = route("COMPLETED");
  render(<RouteWorkspace {...props} routes={[published]} />);
  fireEvent.click(screen.getByRole("button", { name: /Acciones de Ruta PUBLISHED/ }));
  expect(screen.getByRole("menuitem", { name: "Editar orden" })).toBeTruthy();
  expect(screen.queryByRole("menuitem", { name: "Generar propuesta" })).toBeNull();
  cleanup();
  render(<RouteWorkspace {...props} routes={[completed]} />);
  fireEvent.click(screen.getByRole("button", { name: /Acciones de Ruta COMPLETED/ }));
  expect(screen.queryByRole("menuitem", { name: "Editar orden" })).toBeNull();
  expect(screen.getByRole("menuitem", { name: "Ver detalle" })).toBeTruthy();
});

test("sincroniza selección y cierra el menú al cambiar el conjunto de resultados", () => {
  const first = route("DRAFT");
  const next = { ...route("PUBLISHED"), id: "route-next", name: "Ruta siguiente", points: [{ routePointId: "point-next", sequence: 1, customerName: "Cliente siguiente" }] };
  const { rerender } = render(<RouteWorkspace {...props} routes={[first]} />);
  fireEvent.click(screen.getByRole("button", { name: /Acciones de Ruta DRAFT/ }));
  expect(screen.getByRole("menu")).toBeTruthy();
  rerender(<RouteWorkspace {...props} routes={[next]} />);
  expect(screen.queryByRole("menu")).toBeNull();
  expect(screen.getByTestId("route-map").textContent).toBe("Cliente siguiente");
  expect(screen.getByTestId("route-map").getAttribute("data-variant")).toBe("embedded");
  expect(document.querySelector(".route-card__select")?.getAttribute("aria-pressed")).toBe("true");
});

test("usa la paginación propia del rail y conserva su semántica accesible", () => {
  render(<RouteWorkspace {...props} routes={[route("DRAFT")]} totalPages={3} totalElements={41} pageSize={20} />);
  expect(screen.getByRole("navigation", { name: "Paginación de rutas" })).toBeTruthy();
  expect(screen.getByText("1–1 de 41")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Registros por página" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
  expect(props.onPageChange).toHaveBeenCalledWith(1);
});
