import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ConfirmationDialog } from "./ConfirmationDialog";

afterEach(cleanup);

test("mantiene la presentación default sin aplicar la variante golden", () => {
  render(<ConfirmationDialog titleId="default-title" title="Confirmar" message="Mensaje" confirmLabel="Continuar" onCancel={() => undefined} onConfirm={() => undefined} />);
  const dialog = screen.getByRole("alertdialog");
  expect(dialog.className).toContain("confirmation-dialog--default");
  expect(dialog.className).not.toContain("confirmation-dialog--golden");
});

test("la variante golden expone tres regiones, descripción y cierre por scrim", () => {
  const onCancel = vi.fn();
  render(<ConfirmationDialog appearance="golden" titleId="status-dialog-title" descriptionId="status-dialog-description" module="Usuarios" title="Bloquear usuario" headerDescription="Confirma el cambio de acceso para este usuario." bodyTitle="¿Bloquear a Ada?" message="Ada perderá acceso." confirmLabel="Bloquear usuario" onCancel={onCancel} onConfirm={() => undefined} />);
  const dialog = screen.getByRole("alertdialog");
  expect(dialog.getAttribute("aria-labelledby")).toBe("status-dialog-title");
  expect(dialog.getAttribute("aria-describedby")).toBe("status-dialog-description");
  expect(dialog.children.item(0)?.tagName).toBe("HEADER");
  expect(dialog.children.item(1)?.className).toContain("confirmation-dialog__content");
  expect(dialog.children.item(2)?.tagName).toBe("FOOTER");
  fireEvent.mouseDown(dialog.parentElement as HTMLElement);
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("busy conserva el diálogo y muestra progreso específico", () => {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(<ConfirmationDialog appearance="golden" titleId="status-dialog-title" descriptionId="status-dialog-description" module="Usuarios" title="Bloquear usuario" headerDescription="Confirma el cambio de acceso para este usuario." bodyTitle="¿Bloquear a Ada?" message="Ada perderá acceso." confirmLabel="Bloquear usuario" busy busyLabel="Bloqueando…" onCancel={onCancel} onConfirm={onConfirm} />);
  const dialog = screen.getByRole("alertdialog");
  fireEvent.mouseDown(dialog.parentElement as HTMLElement);
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Bloqueando…" }));
  expect(onCancel).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.getByRole("alertdialog")).toBe(dialog);
  expect(dialog.querySelector(".confirmation-dialog__spinner")).toBeTruthy();
});
