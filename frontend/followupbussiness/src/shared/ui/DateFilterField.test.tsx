import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DateFilterField } from "./DateFilterField";

function todayIso() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

test("withTime conserva fecha borrador, normaliza hora y confirma dentro del popover", () => {
  const onValueChange = vi.fn();
  render(<DateFilterField label="Inicio de jornada" value="" onValueChange={onValueChange} withTime required />);
  expect(screen.getByRole("button", { name: "Inicio de jornada" })).toBeTruthy();
  expect(screen.queryByLabelText("Hora")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Inicio de jornada" }));
  expect(screen.getByRole("button", { name: "Aplicar" }).hasAttribute("disabled")).toBe(true);
  const selected = todayIso();
  fireEvent.click(document.querySelector<HTMLButtonElement>(`[data-date="${selected}"]`)!);
  expect(screen.getByRole("dialog", { name: "Calendario de Inicio de jornada" })).toBeTruthy();
  const time = screen.getByLabelText("Hora");
  expect(time.getAttribute("type")).toBe("text");
  fireEvent.change(time, { target: { value: "0930" } });
  expect((time as HTMLInputElement).value).toBe("09:30");
  fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
  expect(onValueChange).toHaveBeenCalledWith(`${selected}T09:30`);
  expect(screen.queryByLabelText("Hora")).toBeNull();
});

test("date-only selecciona y cierra inmediatamente", () => {
  const onValueChange = vi.fn();
  render(<DateFilterField label="Fecha" value="" onValueChange={onValueChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Fecha" }));
  const selected = todayIso();
  fireEvent.click(document.querySelector<HTMLButtonElement>(`[data-date="${selected}"]`)!);
  expect(onValueChange).toHaveBeenCalledWith(selected);
  expect(screen.queryByRole("dialog", { name: "Calendario de Fecha" })).toBeNull();
});

test("withTime no da a hoy un marcador visual competidor cuando hay fecha seleccionada", () => {
  const onValueChange = vi.fn();
  const now = new Date();
  const selectedIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate() === 1 ? 2 : 1).padStart(2, "0")}`;
  const { container } = render(
    <DateFilterField
      label="Inicio de jornada"
      value={`${selectedIso}T09:30`}
      onValueChange={onValueChange}
      withTime
    />,
  );

  fireEvent.click(within(container).getByRole("button", { name: "Inicio de jornada" }));

  const selectedDay = document.querySelector<HTMLButtonElement>(`[data-date="${selectedIso}"]`)!;
  const today = document.querySelector<HTMLButtonElement>('[aria-current="date"]')!;
  const days = selectedDay.parentElement!;

  expect(days.classList.contains("date-filter__days--has-selection")).toBe(true);
  expect(selectedDay.getAttribute("aria-pressed")).toBe("true");
  expect(today.getAttribute("aria-pressed")).toBe("false");
});

test("expone validación y ayuda accesible en el disparador", () => {
  render(<DateFilterField label="Vigente desde" value="" onValueChange={() => undefined} invalid describedBy="date-error" />);
  const trigger = screen.getByRole("button", { name: "Vigente desde" });
  expect(trigger.getAttribute("aria-invalid")).toBe("true");
  expect(trigger.getAttribute("aria-describedby")).toBe("date-error");
});
