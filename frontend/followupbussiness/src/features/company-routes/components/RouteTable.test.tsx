import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RouteTable } from "./RouteTable";

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED" as const, points: [{ sequence: 1, customerName: "Comercial Norte" }], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
test("muestra un resumen minimizado y abre el detalle desde el menú de acciones", () => {
  const detail = vi.fn(); const page = vi.fn();
  render(<RouteTable routes={[route]} sellers={[{ id: "seller-1", label: "Ana" }]} page={0} pageSize={5} totalPages={2} totalElements={6} lastUpdated={new Date("2026-08-26T11:00:00Z")} onDetail={detail} onPageChange={page} onPageSizeChange={() => undefined} />);
  const table = screen.getByRole("table", { name: "Rutas" });
  expect(table.textContent).toContain("Ana"); expect(table.textContent).toContain("Publicada"); expect(table.textContent).not.toContain("customer-1");
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Norte" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Visualizar ruta" })); expect(detail).toHaveBeenCalledWith(route);
  fireEvent.click(screen.getByRole("button", { name: "Página siguiente" })); expect(page).toHaveBeenCalledWith(1);
});
