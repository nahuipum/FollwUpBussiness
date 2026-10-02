import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RouteDetailDialog } from "./RouteDetailDialog";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));
afterEach(cleanup);

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED" as const, points: [{ sequence: 2, customerName: null }, { sequence: 1, customerName: "Comercial Norte" }], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
test("muestra la secuencia y la vista de mapa en modo solo lectura", () => {
  render(<RouteDetailDialog target={route} route={route} sellerLabel="Ana" sellerAvailable onPublish={() => undefined} loading={false} error={null} canGenerateProposal={false} canPublish={false} onGenerateProposal={() => undefined} onRetry={() => undefined} onClose={() => undefined} />);
  expect(screen.getByRole("heading", { name: "Secuencia de visitas" })).toBeTruthy();
  expect(screen.getByText("Planificación del 26 de agosto de 2026")).toBeTruthy();
  expect(screen.getAllByText("Comercial Norte").length).toBeGreaterThan(0); expect(screen.getAllByText("Cliente no disponible").length).toBeGreaterThan(0);
  expect(screen.queryByText("customer-1")).toBeNull(); expect(screen.queryByText("-12.04")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cerrar detalle" }));
});
test("ofrece generar propuesta sólo desde el detalle de un borrador autorizado", () => {
  const onGenerateProposal = vi.fn();
  const calls: string[] = [];
  render(<RouteDetailDialog target={{ ...route, status: "DRAFT" }} route={{ ...route, status: "DRAFT" }} sellerLabel="Ana" sellerAvailable onPublish={() => undefined} loading={false} error={null} canGenerateProposal={true} canPublish={false} onGenerateProposal={(target) => { calls.push("proposal"); onGenerateProposal(target); }} onRetry={() => undefined} onClose={() => { calls.push("close"); }} />);
  fireEvent.click(screen.getByRole("button", { name: "Generar propuesta" }));
  expect(onGenerateProposal).toHaveBeenCalledWith(expect.objectContaining({ id: "route-1", status: "DRAFT" }));
  expect(calls).toEqual(["close", "proposal"]);
});
test("ofrece publicar solo al administrador autorizado cuando el vendedor está activo", () => {
  const publish = vi.fn();
  render(<RouteDetailDialog target={{ ...route, status: "DRAFT" }} route={{ ...route, status: "DRAFT" }} sellerLabel="Ana" sellerAvailable canPublish canGenerateProposal={false} onPublish={publish} onGenerateProposal={() => undefined} loading={false} error={null} onRetry={() => undefined} onClose={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Publicar ruta" }));
  expect(publish).toHaveBeenCalledWith(expect.objectContaining({ status: "DRAFT" }));
});
test("explica el borrador vencido, no permite publicarlo y ofrece copiarlo", () => {
  const expired = { ...route, status: "DRAFT" as const, publicationEligibility: { eligible: false, reason: "OPERATIONAL_DATE_EXPIRED" as const } };
  const copy = vi.fn();
  render(<RouteDetailDialog target={expired} route={expired} sellerLabel="Ana" sellerAvailable canManage onCopy={copy} onPublish={() => undefined} onGenerateProposal={() => undefined} loading={false} error={null} onRetry={() => undefined} onClose={() => undefined} />);
  expect(screen.getAllByText("Borrador vencido").length).toBeGreaterThan(0);
  expect(screen.getByText(/conserva su estado DRAFT/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Publicar ruta" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Copiar ruta" }));
  expect(copy).toHaveBeenCalledWith(expired);
});
