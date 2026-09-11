import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SellerAssignmentDialog } from "./SellerAssignmentDialog";

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};

afterEach(() => document.body.replaceChildren());

test("envía los territorios seleccionados al pulsar Asignar territorios", () => {
  const submit = vi.fn();
  render(
    <SellerAssignmentDialog
      seller={seller}
      kind="territories"
      options={{ supervisors: [], territories: [{ id: "territory-1", code: "LIM", name: "Lima" }] }}
      loading={false}
      busy={false}
      error={null}
      onClose={() => undefined}
      onRetry={() => undefined}
      onSubmit={submit}
    />,
  );

  const save = screen.getByRole("button", { name: "Asignar territorios" }) as HTMLButtonElement;
  expect(save.disabled).toBe(false);
  fireEvent.click(save);
  expect(screen.getByRole("alert").textContent).toContain("Selecciona al menos un territorio");
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Territorios" }));
  fireEvent.click(screen.getByLabelText("LIM — Lima"));
  expect(save.disabled).toBe(false);
  fireEvent.click(save);

  expect(submit).toHaveBeenCalledWith(["territory-1"]);
});

test("inhabilita el guardado cuando no hay territorios activos", () => {
  const submit = vi.fn();
  render(<SellerAssignmentDialog seller={seller} kind="territories" options={{ supervisors: [], territories: [] }} loading={false} busy={false} error={null} onClose={() => undefined} onRetry={() => undefined} onSubmit={submit} />);

  expect(screen.getByText("No hay territorios activos")).toBeTruthy();
  expect((screen.getByRole("button", { name: "Asignar territorios" }) as HTMLButtonElement).disabled).toBe(true);
  expect(submit).not.toHaveBeenCalled();
});

test("muestra localmente el correlation ID validado de una asignación rechazada", () => {
  render(<SellerAssignmentDialog seller={seller} kind="supervisor" options={{ supervisors: [], territories: [] }} loading={false} busy={false} error={{ status: 422, correlationId: "00000000-0000-4000-8000-000000000006", fieldErrors: [] }} onClose={() => undefined} onRetry={() => undefined} onSubmit={() => undefined} />);
  expect(screen.getByText("Correlation ID: 00000000-0000-4000-8000-000000000006")).toBeTruthy();
});

test.each([
  [403, "No tienes permiso"],
  [409, "cambió mientras la editabas"],
  [422, "no es válida"],
])("explica el rechazo HTTP %i de la asignación", (status, message) => {
  render(<SellerAssignmentDialog seller={seller} kind="supervisor" options={{ supervisors: [], territories: [] }} loading={false} busy={false} error={{ status: status as 403 | 409 | 422, correlationId: null, fieldErrors: [] }} onClose={() => undefined} onRetry={() => undefined} onSubmit={() => undefined} />);

  expect(screen.getByRole("alert").textContent).toContain(message);
});
