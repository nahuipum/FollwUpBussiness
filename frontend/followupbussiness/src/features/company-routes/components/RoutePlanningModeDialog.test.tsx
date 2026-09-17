import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RoutePlanningModeDialog } from "./RoutePlanningModeDialog";

test("expone planificación manual y automática sin publicar", () => {
  const select = vi.fn();
  render(<RoutePlanningModeDialog onSelect={select} onClose={() => undefined} />);
  expect(screen.getByText(/Ninguna opción publica automáticamente/)).toBeTruthy();
  const manual = screen.getByRole("button", { name: /Crear manualmente/ });
  expect(manual.getAttribute("aria-pressed")).toBe("true");
  expect(document.activeElement).toBe(manual);
  fireEvent.click(screen.getByRole("button", { name: /Crear manualmente/ }));
  expect(select).toHaveBeenCalledWith("manual");
  fireEvent.click(screen.getByRole("button", { name: /Generar automáticamente/ }));
  expect(select).toHaveBeenCalledWith("automatic");
});
