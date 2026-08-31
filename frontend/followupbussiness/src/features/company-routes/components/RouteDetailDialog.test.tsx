import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RouteDetailDialog } from "./RouteDetailDialog";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED" as const, points: [{ sequence: 2, customerName: null }, { sequence: 1, customerName: "Comercial Norte" }], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
test("muestra la secuencia y la vista de mapa en modo solo lectura", () => {
  render(<RouteDetailDialog target={route} route={route} sellerLabel="Ana" loading={false} error={null} canGenerateProposal={false} onGenerateProposal={() => undefined} onRetry={() => undefined} onClose={() => undefined} />);
  expect(screen.getByRole("heading", { name: "Visitas programadas" })).toBeTruthy();
  expect(screen.getByText("Comercial Norte")).toBeTruthy(); expect(screen.getByText("Cliente no disponible")).toBeTruthy();
  expect(screen.queryByText("customer-1")).toBeNull(); expect(screen.queryByText("-12.04")).toBeNull();
});
test("ofrece generar propuesta sólo desde el detalle de un borrador autorizado", () => {
  const onGenerateProposal = vi.fn();
  const calls: string[] = [];
  render(<RouteDetailDialog target={{ ...route, status: "DRAFT" }} route={{ ...route, status: "DRAFT" }} sellerLabel="Ana" loading={false} error={null} canGenerateProposal={true} onGenerateProposal={(target) => { calls.push("proposal"); onGenerateProposal(target); }} onRetry={() => undefined} onClose={() => { calls.push("close"); }} />);
  fireEvent.click(screen.getByRole("button", { name: "Generar propuesta" }));
  expect(onGenerateProposal).toHaveBeenCalledWith(expect.objectContaining({ id: "route-1", status: "DRAFT" }));
  expect(calls).toEqual(["close", "proposal"]);
});
