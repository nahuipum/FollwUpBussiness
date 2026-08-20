import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ModalAsyncState } from "./ModalAsyncState";

afterEach(cleanup);

test("presenta un error de carga y delega las acciones", () => {
  const retry = vi.fn();
  const close = vi.fn();
  render(<ModalAsyncState state="error" title="No pudimos cargar" message="Inténtalo nuevamente." correlationId="corr-1" primaryAction={{ label: "Reintentar", onClick: retry }} secondaryAction={{ label: "Cerrar", onClick: close }} />);
  expect(screen.getByRole("alert").textContent).toContain("Código de seguimiento: corr-1");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(close).toHaveBeenCalledOnce();
});

test("expone la carga como estado ocupado sin acciones", () => {
  render(<ModalAsyncState state="loading" title="Cargando información" message="Espera un momento." />);
  expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
  expect(screen.queryByRole("button")).toBeNull();
});
