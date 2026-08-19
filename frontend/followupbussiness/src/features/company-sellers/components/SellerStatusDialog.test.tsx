import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SellerStatusDialog } from "./SellerStatusDialog";

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};

afterEach(() => document.body.replaceChildren());

test("valida, anuncia y confirma la inactivación accesible", () => {
  const confirm = vi.fn();
  const change = vi.fn();
  render(<SellerStatusDialog seller={seller} reason="" busy={false} error={null} onReasonChange={change} onClose={() => undefined} onConfirm={confirm} />);
  expect(screen.getByRole("dialog", { name: "Inactivar vendedor" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText("Motivo del cambio"));
  expect(screen.getByText(/Se revocará su acceso/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Inactivar vendedor" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Motivo del cambio"), { target: { value: "no" } });
  expect(change).toHaveBeenCalledWith("no");
});

test("no permite cerrar ni reenviar mientras guarda", () => {
  const close = vi.fn();
  render(<SellerStatusDialog seller={seller} reason="Motivo válido" busy error={null} onReasonChange={() => undefined} onClose={close} onConfirm={() => undefined} />);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(close).toHaveBeenCalledOnce();
  expect((screen.getByRole("button", { name: "Guardando…" }) as HTMLButtonElement).disabled).toBe(true);
});

test("permite cancelar sin enviar cambios", () => {
  const close = vi.fn();
  const confirm = vi.fn();
  render(<SellerStatusDialog seller={seller} reason="Motivo válido" busy={false} error={null} onReasonChange={() => undefined} onClose={close} onConfirm={confirm} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(close).toHaveBeenCalledOnce();
  expect(confirm).not.toHaveBeenCalled();
});
