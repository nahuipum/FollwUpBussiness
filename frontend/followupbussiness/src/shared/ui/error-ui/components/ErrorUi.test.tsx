import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ErrorState, InlineAlert, SessionExpiredDialog } from "./index";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("renders visual warning and error alerts", () => {
  const { rerender } = render(<InlineAlert variant="warning" message="Información actualizada" action={{ label: "Actualizar" }} correlationId="00000000-0000-4000-8000-000000000001" />);
  expect(screen.getByRole("alert").classList.contains("error-ui-inline-alert--warning")).toBe(true);
  expect(screen.getByText("Correlation ID: 00000000-0000-4000-8000-000000000001")).toBeTruthy();

  rerender(<InlineAlert variant="error" title="No disponible" message="Inténtalo más tarde" />);
  expect(screen.getByRole("alert").classList.contains("error-ui-inline-alert--error")).toBe(true);
  expect(screen.getByRole("heading", { name: "No disponible" })).toBeTruthy();
});

test("renders session dialog as visual accessible dialog", () => {
  render(<SessionExpiredDialog title="Tu sesión terminó" message="Inicia sesión nuevamente." primaryAction={{ label: "Iniciar sesión" }} secondaryAction={{ label: "Volver al inicio" }} dismissAction={{ label: "Cerrar diálogo" }} />);
  expect(screen.getByRole("dialog", { name: "Tu sesión terminó" }).getAttribute("aria-modal")).toBe("true");
  expect(screen.getByRole("button", { name: "Cerrar diálogo" })).toBeTruthy();
});

test("renders temporary state with secondary correlation identifier", () => {
  render(<ErrorState variant="temporary" title="Ocurrió un problema temporal" message="Inténtalo nuevamente." primaryAction={{ label: "Reintentar" }} secondaryAction={{ label: "Ir al inicio" }} correlationId="00000000-0000-4000-8000-000000000001" />);
  expect(screen.getByRole("heading", { name: "Ocurrió un problema temporal" })).toBeTruthy();
  expect(screen.getByText("Correlation ID: 00000000-0000-4000-8000-000000000001")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Copiar ID de seguimiento" })).toBeTruthy();
});

test("copies only a valid correlation ID and announces the result", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<ErrorState variant="temporary" title="Ocurrió un problema temporal" message="Inténtalo nuevamente." primaryAction={{ label: "Reintentar" }} correlationId="00000000-0000-4000-8000-000000000001" />);

  fireEvent.click(screen.getByRole("button", { name: "Copiar ID de seguimiento" }));

  expect(writeText).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  expect((await screen.findByRole("status")).textContent).toContain("ID de seguimiento copiado.");
});

test("does not render an invalid correlation ID", () => {
  render(<InlineAlert variant="error" message="No disponible" correlationId="hostile-value" />);
  expect(screen.queryByRole("button", { name: "Copiar ID de seguimiento" })).toBeNull();
});
