import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ErrorState, InlineAlert, SessionExpiredDialog } from "./index";

test("renders visual warning and error alerts", () => {
  const { rerender } = render(<InlineAlert variant="warning" message="Información actualizada" action={{ label: "Actualizar" }} correlationId="safe-123" />);
  expect(screen.getByRole("alert").classList.contains("error-ui-inline-alert--warning")).toBe(true);
  expect(screen.getByText("ID de seguimiento:")).toBeTruthy();

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
  render(<ErrorState variant="temporary" title="Ocurrió un problema temporal" message="Inténtalo nuevamente." primaryAction={{ label: "Reintentar" }} secondaryAction={{ label: "Ir al inicio" }} correlationId="corr-demo-7B29" />);
  expect(screen.getByRole("heading", { name: "Ocurrió un problema temporal" })).toBeTruthy();
  expect(screen.getByText("Correlation ID: corr-demo-7B29")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Copiar Correlation ID" })).toBeTruthy();
});
