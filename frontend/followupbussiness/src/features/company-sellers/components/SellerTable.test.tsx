import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SellerTable } from "./SellerTable";

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};
const props = (canManage: boolean) => ({
  sellers: [seller], page: 0, totalPages: 1, totalElements: 1, canManage,
  onPageChange: () => undefined, onDetail: () => undefined, onEdit: () => undefined, onAssign: () => undefined,
  onChangeStatus: vi.fn(),
});

afterEach(() => document.body.replaceChildren());

test("solo expone el cambio de estado a COMPANY_ADMIN", () => {
  const admin = props(true);
  const { rerender } = render(<SellerTable {...admin} />);
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana" }));
  fireEvent.click(screen.getByText("Inactivar"));
  expect(admin.onChangeStatus).toHaveBeenCalledWith(seller);
  rerender(<SellerTable {...props(false)} />);
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana" }));
  expect(screen.queryByText("Inactivar")).toBeNull();
  expect(screen.queryByText("Activar")).toBeNull();
});
