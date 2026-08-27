import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RouteDetailDialog } from "./RouteDetailDialog";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED" as const, points: [{ sequence: 2, customerName: null }, { sequence: 1, customerName: "Comercial Norte" }], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
test("muestra la secuencia y la vista de mapa en modo solo lectura", () => {
  render(<RouteDetailDialog target={route} route={route} sellerLabel="Ana" loading={false} error={null} onRetry={() => undefined} onClose={() => undefined} />);
  expect(screen.getByRole("heading", { name: "Visitas programadas" })).toBeTruthy();
  expect(screen.getByText("Comercial Norte")).toBeTruthy(); expect(screen.getByText("Cliente no disponible")).toBeTruthy();
  expect(screen.queryByText("customer-1")).toBeNull(); expect(screen.queryByText("-12.04")).toBeNull();
});
