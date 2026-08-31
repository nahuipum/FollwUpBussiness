import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DateFilterField } from "./DateFilterField";

test("withTime conserva fecha borrador, normaliza hora y confirma dentro del popover", () => {
  const onValueChange = vi.fn();
  render(<DateFilterField label="Inicio de jornada" value="" onValueChange={onValueChange} withTime required />);
  expect(screen.getByRole("button", { name: "Inicio de jornada" })).toBeTruthy();
  expect(screen.queryByLabelText("Hora")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Inicio de jornada" }));
  expect(screen.getByRole("button", { name: "Aplicar" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(document.querySelector<HTMLButtonElement>('[data-date="2026-08-26"]')!);
  expect(screen.getByRole("dialog", { name: "Calendario de Inicio de jornada" })).toBeTruthy();
  const time = screen.getByLabelText("Hora");
  expect(time.getAttribute("type")).toBe("text");
  fireEvent.change(time, { target: { value: "0930" } });
  expect((time as HTMLInputElement).value).toBe("09:30");
  fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
  expect(onValueChange).toHaveBeenCalledWith("2026-08-26T09:30");
  expect(screen.queryByLabelText("Hora")).toBeNull();
});

test("date-only selecciona y cierra inmediatamente", () => {
  const onValueChange = vi.fn();
  render(<DateFilterField label="Fecha" value="" onValueChange={onValueChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Fecha" }));
  fireEvent.click(document.querySelector<HTMLButtonElement>('[data-date="2026-08-26"]')!);
  expect(onValueChange).toHaveBeenCalledWith("2026-08-26");
  expect(screen.queryByRole("dialog", { name: "Calendario de Fecha" })).toBeNull();
});

test("withTime no da a hoy un marcador visual competidor cuando hay fecha seleccionada", () => {
  const onValueChange = vi.fn();
  const { container } = render(
    <DateFilterField
      label="Inicio de jornada"
      value="2026-08-30T09:30"
      onValueChange={onValueChange}
      withTime
    />,
  );

  fireEvent.click(within(container).getByRole("button", { name: "Inicio de jornada" }));

  const selectedDay = document.querySelector<HTMLButtonElement>('[data-date="2026-08-30"]')!;
  const today = document.querySelector<HTMLButtonElement>('[aria-current="date"]')!;
  const days = selectedDay.parentElement!;

  expect(days.classList.contains("date-filter__days--has-selection")).toBe(true);
  expect(selectedDay.getAttribute("aria-pressed")).toBe("true");
  expect(today.getAttribute("aria-pressed")).toBe("false");
});
