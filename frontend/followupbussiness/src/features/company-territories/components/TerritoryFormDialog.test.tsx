import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { TerritoryFormDialog } from "./TerritoryFormDialog";
import type { TerritoryFormInput } from "../types";

const territory = { id: "territory-1", name: "Lima Centro", code: "LIM", description: null, status: "ACTIVE" as const, assignedSellerCount: 3, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 2 };

afterEach(() => document.body.replaceChildren());

function openInactivationConfirmation(onSubmit: (input: TerritoryFormInput) => void) {
  render(<TerritoryFormDialog territory={territory} busy={false} error={null} conflict={false} onClose={() => undefined} onReload={() => undefined} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("button", { name: "Estado" }));
  fireEvent.click(screen.getByRole("option", { name: "Inactiva" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
}

test("cancelar la inactivación cierra la confirmación sin iniciar mutación", () => {
  const submit = vi.fn();
  openInactivationConfirmation(submit);
  expect(screen.getByRole("alertdialog", { name: "Inactivar zona" })).toBeTruthy();
  expect(screen.getByText(/dejará de aceptar nuevas asignaciones/)).toBeTruthy();
  expect(screen.getByText(/No se eliminará ni se desasignarán vendedores o clientes existentes/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("alertdialog", { name: "Inactivar zona" })).toBeNull();
  expect(submit).not.toHaveBeenCalled();
});

test("confirmar la inactivación inicia una única mutación", () => {
  const submit = vi.fn();
  openInactivationConfirmation(submit);
  const confirm = screen.getByRole("button", { name: "Confirmar inactivación" });
  fireEvent.click(confirm);
  expect(submit).toHaveBeenCalledOnce();
  expect(submit).toHaveBeenCalledWith({ name: "Lima Centro", code: "LIM", description: null, status: "INACTIVE" });
});

test("muestra el contexto y las ayudas del catálogo al editar", () => {
  render(<TerritoryFormDialog territory={territory} busy={false} error={null} conflict={false} onClose={() => undefined} onReload={() => undefined} onSubmit={() => undefined} />);
  expect(screen.getByText("Zona activa · 3 vendedores asignados · versión consultada 2")).toBeTruthy();
  expect(screen.getByPlaceholderText("Ej. Lima Centro").getAttribute("aria-describedby")).toBe("territory-name-help");
  expect(screen.getByText(/Las zonas inactivas no aceptan asignaciones nuevas/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Guardar cambios" }).className).toContain("shared-button--primary");
  expect(screen.getByRole("status").className).toContain("error-ui-inline-alert--info");
});

test("el error de conflicto comparte alerta y bloquea recarga durante guardado", () => {
  render(<TerritoryFormDialog territory={territory} busy error={{ status: 409, correlationId: null, fieldErrors: [] }} conflict onClose={() => undefined} onReload={() => undefined} onSubmit={() => undefined} />);
  expect(screen.getByRole("alert").className).toContain("error-ui-inline-alert--warning");
  expect(screen.getByRole("button", { name: "Recargar listado y conservar formulario" })).toHaveProperty("disabled", true);
});
