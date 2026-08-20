import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ClientTable } from "./ClientTable";

const client = { id: "customer-1", name: "Comercial Norte", segment: "Mayorista", territoryId: null, assignedSellerIds: ["seller-1", "seller-2"], status: "ACTIVE" as const, location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 };
afterEach(cleanup);
test("muestra únicamente datos minimizados y delega la paginación real", () => {
  const onPageChange = vi.fn();
  render(<ClientTable clients={[client]} page={0} pageSize={5} totalPages={2} totalElements={6} canManage={false} onDetail={() => undefined} onEdit={() => undefined} onChangeStatus={() => undefined} onPageChange={onPageChange} onPageSizeChange={() => undefined} />);
  expect(screen.getByRole("table", { name: "Clientes" }).textContent).toContain("Comercial Norte");
  expect(screen.getByRole("table", { name: "Clientes" }).textContent).toContain("2");
  expect(screen.queryByText("-12.04")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
  expect(onPageChange).toHaveBeenCalledWith(1);
});

test("centra las acciones y muestra el menú permitido según el rol", () => {
  const onDetail = vi.fn();
  const onEdit = vi.fn();
  const onChangeStatus = vi.fn();
  const { rerender } = render(<ClientTable clients={[client]} page={0} pageSize={5} totalPages={1} totalElements={1} canManage={false} onDetail={onDetail} onEdit={onEdit} onChangeStatus={onChangeStatus} onPageChange={() => undefined} onPageSizeChange={() => undefined} />);

  const actionsHeading = screen.getByRole("columnheader", { name: "Acciones" });
  expect(actionsHeading.className).toContain("data-table__cell--center");
  expect((actionsHeading as HTMLElement).style.width).toBe("9%");
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Comercial Norte" }));
  expect(screen.getByRole("menuitem", { name: "Ver cliente" })).toBeTruthy();
  expect(screen.queryByRole("menuitem", { name: "Editar cliente" })).toBeNull();
  fireEvent.click(screen.getByRole("menuitem", { name: "Ver cliente" }));
  expect(onDetail).toHaveBeenCalledWith(client);

  rerender(<ClientTable clients={[client]} page={0} pageSize={5} totalPages={1} totalElements={1} canManage onDetail={onDetail} onEdit={onEdit} onChangeStatus={onChangeStatus} onPageChange={() => undefined} onPageSizeChange={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Comercial Norte" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Editar cliente" }));
  expect(onEdit).toHaveBeenCalledWith(client);
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Comercial Norte" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Inactivar cliente" }));
  expect(onChangeStatus).toHaveBeenCalledWith(client);
});
