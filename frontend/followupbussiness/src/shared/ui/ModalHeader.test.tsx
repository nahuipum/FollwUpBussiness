import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ModalHeader } from "./ModalHeader";

afterEach(cleanup);

test("renderiza el módulo, título y cierre accesible", () => {
  const onClose = vi.fn();
  render(
    <ModalHeader
      module="Clientes"
      title="Crear cliente"
      titleId="client-title"
      description="Completa los datos del cliente."
      onClose={onClose}
      closeLabel="Cerrar formulario"
    />,
  );

  expect(screen.getByText("Clientes").className).toContain(
    "shared-modal-header__module",
  );
  expect(screen.getByRole("heading", { name: "Crear cliente" }).id).toBe(
    "client-title",
  );
  expect(screen.getByText("Completa los datos del cliente.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar formulario" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("permite encabezados de confirmación sin cierre", () => {
  render(
    <ModalHeader module="Zonas" title="Inactivar zona" titleId="zone-title" />,
  );

  expect(screen.getByText("Zonas")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});
