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
