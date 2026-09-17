import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { TimeField } from "./TimeField";

test("normaliza la hora sin abrir un calendario", () => {
  const onValueChange = vi.fn();
  render(<TimeField label="Inicio de jornada" value="" onValueChange={onValueChange} required />);
  const field = screen.getByLabelText("Inicio de jornada");
  expect(field.getAttribute("type")).toBe("text");
  fireEvent.change(field, { target: { value: "0930" } });
  expect(onValueChange).toHaveBeenCalledWith("09:30");
});

test("muestra el reloj decorativo solo cuando se solicita", () => {
  const { container } = render(<TimeField label="Inicio de ventana" value="08:00" onValueChange={vi.fn()} variant="golden" showClockIcon />);
  expect(container.querySelector(".time-field__clock")).toBeTruthy();
  expect(screen.getByLabelText("Inicio de ventana").getAttribute("type")).toBe("text");
});
