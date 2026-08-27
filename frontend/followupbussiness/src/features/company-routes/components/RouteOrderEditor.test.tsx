import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RouteOrderEditor } from "./RouteOrderEditor";
import type { Route } from "../types";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));
vi.mock("./RouteSequenceMap", () => ({ RouteSequenceMap: () => <div aria-label="Mapa de la ruta" /> }));

const baseRoute: Route = {
  id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT", updatedAt: "2026-08-26T12:00:00Z", version: 1,
  points: [
    { sequence: 2, customerName: "Cliente final" },
    { sequence: 1, customerName: "Cliente inicio" },
  ],
};

test("marca la primera y última visita según la secuencia guardada", () => {
  render(<RouteOrderEditor route={baseRoute} saving={false} onMove={vi.fn()} onMoveTo={vi.fn()} />);
  expect(screen.getByText("Cliente inicio").closest("li")?.textContent).toContain("Inicio");
  expect(screen.getByText("Cliente final").closest("li")?.textContent).toContain("Final");
});

test("una única visita se identifica como inicio y final", () => {
  render(<RouteOrderEditor route={{ ...baseRoute, points: [{ sequence: 1, customerName: "Única visita" }] }} saving={false} onMove={vi.fn()} onMoveTo={vi.fn()} />);
  expect(screen.getByText("Inicio y final")).toBeTruthy();
});

test("no expone el ID opaco del punto al activar el reordenamiento por teclado", () => {
  const secret = "opaque-route-point-SECRET";
  render(<RouteOrderEditor route={{ ...baseRoute, points: [{ routePointId: secret, sequence: 1, customerName: "Cliente inicio" }, { routePointId: "opaque-route-point-2", sequence: 2, customerName: "Cliente final" }] }} saving={false} onMove={vi.fn()} onMoveTo={vi.fn()} />);
  fireEvent.keyDown(screen.getAllByRole("button", { name: "Reordenar Cliente inicio" }).at(-1)!, { key: " " });
  expect(document.body.textContent).not.toContain(secret);
});
