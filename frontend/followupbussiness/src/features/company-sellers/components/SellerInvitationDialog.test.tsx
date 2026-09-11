import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SellerInvitationDialog } from "./SellerInvitationDialog";

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "INVITED" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};

afterEach(() => document.body.replaceChildren());

test("confirma en bottom sheet golden y expone el error de conflicto", () => {
  const confirm = vi.fn();
  render(<SellerInvitationDialog seller={seller} busy={false} success={false} error={{ status: 409, correlationId: null, fieldErrors: [] }} onClose={() => undefined} onConfirm={confirm} />);
  expect(
    screen.getByRole("alertdialog", { name: "Reenviar invitación" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reenviar invitación" }));
  expect(confirm).toHaveBeenCalledOnce();
  expect(screen.getByRole("alert").textContent).toContain("La invitación cambió");
});

test("declara la aceptación asíncrona sin afirmar la entrega", () => {
  render(
    <SellerInvitationDialog
      seller={seller}
      busy={false}
      success
      error={null}
      onClose={() => undefined}
      onConfirm={() => undefined}
    />,
  );

  expect(screen.getByText("Invitación aceptada para entrega")).toBeTruthy();
  expect(screen.getByText(/se procesará de forma asíncrona/)).toBeTruthy();
});

test("bloquea la confirmación mientras reenvía", () => {
  render(<SellerInvitationDialog seller={seller} busy success={false} error={null} onClose={() => undefined} onConfirm={() => undefined} />);
  expect((screen.getByRole("button", { name: "Reenviando…" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement).disabled).toBe(true);
});
