import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ClientTable } from "./ClientTable";

const client = { id: "customer-1", name: "Comercial Norte", segment: "Mayorista", territoryId: null, assignedSellerIds: ["seller-1", "seller-2"], status: "ACTIVE" as const, location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 };
test("muestra únicamente datos minimizados y delega la paginación real", () => {
  const onPageChange = vi.fn();
  render(<ClientTable clients={[client]} page={0} pageSize={5} totalPages={2} totalElements={6} onPageChange={onPageChange} onPageSizeChange={() => undefined} />);
  expect(screen.getByRole("table", { name: "Clientes" }).textContent).toContain("Comercial Norte");
  expect(screen.getByRole("table", { name: "Clientes" }).textContent).toContain("2");
  expect(screen.queryByText("-12.04")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
  expect(onPageChange).toHaveBeenCalledWith(1);
});
