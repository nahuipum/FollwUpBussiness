import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SellerOperationDialog } from "./SellerOperationDialog";

afterEach(() => document.body.replaceChildren());

test("confirma una operación satisfactoria y se cierra al aceptar", () => {
  const close = vi.fn();
  render(<SellerOperationDialog tone="success" message="Vendedor actualizado correctamente." onClose={close} />);
  expect(screen.getByRole("status").textContent).toContain("actualizado");
  fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
  expect(close).toHaveBeenCalledOnce();
});

test("expone el mensaje de error y permite cerrarlo", () => {
  const close = vi.fn();
  render(<SellerOperationDialog tone="error" message="No se pudo guardar." onClose={close} />);
  expect(screen.getByRole("alert").textContent).toContain("No se pudo guardar");
  fireEvent.click(screen.getByRole("button", { name: "Cerrar mensaje" }));
  expect(close).toHaveBeenCalledOnce();
});
