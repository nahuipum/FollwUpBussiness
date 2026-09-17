import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { RouteOrderEditor } from "./RouteOrderEditor";
import { moveDraggedRoutePoint, routeDragOriginStyle, routePointSortableId } from "../route-ordering";
import type { Route } from "../types";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));
vi.mock("./RouteSequenceMap", () => ({ RouteSequenceMap: ({ points }: { points: readonly { sequence: number; customerName: string | null }[] }) => <div aria-label="Mapa de la ruta">{points.map((point) => <span key={point.customerName}>{point.customerName}:{point.sequence}</span>)}</div> }));

const baseRoute: Route = {
  id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT", updatedAt: "2026-08-26T12:00:00Z", version: 1,
  points: [
    { sequence: 2, customerName: "Cliente final" },
    { sequence: 1, customerName: "Cliente inicio" },
  ],
};

test("marca la primera y última visita según la secuencia guardada", () => {
  render(<RouteOrderEditor route={baseRoute} saving={false} onMove={vi.fn()} onMoveTo={vi.fn()} />);
  expect(screen.getByLabelText("Mapa de la ruta")).toBeTruthy();
  expect(screen.getByText("Cliente inicio").closest("li")?.textContent).toContain("Inicio");
  expect(screen.getByText("Cliente final").closest("li")?.textContent).toContain("Final");
});

test("asocia la lista con su ayuda propia para no colisionar con la del modal", () => {
  const { container } = render(<RouteOrderEditor route={baseRoute} saving={false} onMove={vi.fn()} onMoveTo={vi.fn()} />);
  expect(container.querySelectorAll("#route-order-editor-help")).toHaveLength(1);
  expect(container.querySelector("ol")?.getAttribute("aria-describedby")).toBe("route-order-editor-help");
  expect(container.querySelector("#route-order-help")).toBeNull();
});

test("usa identificadores opacos estables y mueve el elemento arrastrado al destino", () => {
  const moveTo = vi.fn();
  const first = { routePointId: "opaque-point-1", sequence: 8, customerName: "Cliente inicio" };
  const second = { routePointId: "opaque-point-2", sequence: 1, customerName: "Cliente final" };
  const itemIds = [routePointSortableId(first), routePointSortableId(second)];
  expect(itemIds).toEqual(["route-point-opaque-point-1", "route-point-opaque-point-2"]);
  moveDraggedRoutePoint(itemIds[0]!, itemIds[1]!, itemIds as string[], moveTo);
  expect(moveTo).toHaveBeenCalledWith(0, 1);
});

test("deshabilita el arrastre sin un identificador opaco y conserva las flechas", () => {
  const move = vi.fn();
  render(<RouteOrderEditor route={baseRoute} saving={false} onMove={move} onMoveTo={vi.fn()} />);
  expect(routePointSortableId({ sequence: 1, customerName: "Sin ID" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Reordenar Cliente inicio" })).toBeNull();
  fireEvent.click(screen.getAllByRole("button", { name: "Bajar Cliente inicio" }).at(-1)!);
  expect(move).toHaveBeenCalledWith(0, 1);
});

test("reordenar actualiza inmediatamente la numeración de los marcadores temporales", () => {
  function Harness() {
    const [route, setRoute] = useState(baseRoute);
    const move = (index: number, direction: -1 | 1) => setRoute((current) => { const points = [...current.points].sort((a, b) => a.sequence - b.sequence); const [point] = points.splice(index, 1); if (point) points.splice(index + direction, 0, point); return { ...current, points: points.map((item, position) => ({ ...item, sequence: position + 1 })) }; });
    return <RouteOrderEditor route={route} saving={false} onMove={move} onMoveTo={vi.fn()} previewEnabled={false} markerOnly />;
  }
  render(<Harness />);
  const map = () => screen.getAllByLabelText("Mapa de la ruta").at(-1)!;
  expect(map().textContent).toContain("Cliente inicio:1");
  fireEvent.click(screen.getAllByRole("button", { name: "Bajar Cliente inicio" }).at(-1)!);
  expect(map().textContent).toContain("Cliente inicio:2");
  expect(map().textContent).toContain("Cliente final:1");
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

test("oculta la tarjeta de origen durante el arrastre sin eliminar su espacio", () => {
  expect(routeDragOriginStyle(true, "translate3d(0, 12px, 0)", "transform 150ms")).toEqual({ transform: "translate3d(0, 12px, 0)", transition: "transform 150ms", visibility: "hidden" });
  expect(routeDragOriginStyle(false, undefined, undefined).visibility).toBeUndefined();
});
