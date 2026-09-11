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
  sellers: [seller], page: 0, pageSize: 5 as const, totalPages: 1, totalElements: 1, canManage,
  onPageChange: () => undefined, onPageSizeChange: () => undefined, onDetail: () => undefined, onEdit: () => undefined, onAssign: () => undefined,
  onChangeStatus: vi.fn(), onResendInvitation: vi.fn(),
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

test("solo ofrece reenviar invitación a COMPANY_ADMIN para vendedores invitados", () => {
  const invited = { ...seller, status: "INVITED" as const };
  const resend = vi.fn();
  render(<SellerTable {...props(true)} sellers={[invited]} onResendInvitation={resend} />);
  expect(screen.getByText("Pendiente de invitación")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Reenviar invitación" }));
  expect(resend).toHaveBeenCalledWith(invited);
  document.body.replaceChildren();
  render(<SellerTable {...props(true)} />);
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana" }));
  expect(screen.queryByRole("menuitem", { name: "Reenviar invitación" })).toBeNull();
});

test("permite elegir cantidad de registros por página", () => {
  const onPageSizeChange = vi.fn();
  render(<SellerTable {...props(true)} onPageSizeChange={onPageSizeChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Registros por página" }));
  fireEvent.click(screen.getByRole("option", { name: "10" }));
  expect(onPageSizeChange).toHaveBeenCalledWith(10);
});

test("el menú declara su tipo, se cierra con Escape y devuelve el foco", () => {
  render(<SellerTable {...props(true)} />);
  const trigger = screen.getByRole("button", { name: "Más acciones para Ana" });
  expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("la etiqueta INACTIVE usa el tono de peligro", () => {
  render(
    <SellerTable
      {...props(true)}
      sellers={[{ ...seller, status: "INACTIVE" as const }]}
    />,
  );
  expect(screen.getByText("Inactivo").parentElement?.className).toContain(
    "danger",
  );
});
