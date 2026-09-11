import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MultiSelect } from "./MultiSelect";

afterEach(() => document.body.replaceChildren());

const territories = [
  { value: "north", label: "Norte", meta: "NOR", description: "Territorio activo" },
  { value: "south", label: "Sur", meta: "SUR", description: "Territorio activo" },
];

test("closeOnSelect cierra el menú y permite reabrirlo", () => {
  const onChange = vi.fn();
  render(<MultiSelect label="Visitas" ariaLabel="Visitas" value={[]} options={[{ value: "one", label: "Primera" }, { value: "two", label: "Segunda" }]} onChange={onChange} closeOnSelect />);
  const trigger = screen.getByRole("button", { name: "Visitas" });
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("checkbox", { name: "Primera" }));
  expect(onChange).toHaveBeenCalledWith(["one"]);
  expect(screen.queryByRole("listbox", { name: "Visitas" })).toBeNull();
  fireEvent.click(trigger);
  expect(screen.getByRole("checkbox", { name: "Segunda" })).toBeTruthy();
});

test("la variante golden conserva copy, búsqueda, vacío, chips y footer de territorios", () => {
  const onChange = vi.fn();
  const { rerender } = render(<MultiSelect variant="golden" searchable label="Territorios" ariaLabel="Territorios" value={["north"]} options={territories} onChange={onChange} selectionNoun="territorios" searchPlaceholder="Buscar por código o nombre" emptyMessage="No encontramos territorios activos." selectedSummary={(count) => `${count} territorio seleccionado`} visibleSummary={(count) => `${count} coincidencia visible`} totalSummary={(count) => `${count} territorios disponibles`} />);
  const trigger = screen.getByRole("button", { name: "Territorios" });
  expect(trigger.textContent).toContain("1 territorio seleccionado");
  expect(screen.getByLabelText("1 territorios seleccionados").textContent).toContain("Norte");
  fireEvent.click(trigger);
  expect(screen.getByRole("option", { name: "NOR — Norte" }).textContent).toContain("Territorio activo");
  expect(screen.getByText("2 coincidencia visible")).toBeTruthy();
  expect(screen.getByText("2 territorios disponibles")).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText("Buscar por código o nombre"), { target: { value: "ausente" } });
  expect(screen.getByRole("status").textContent).toContain("No encontramos territorios activos.");
  fireEvent.click(screen.getByLabelText("Quitar Norte"));
  expect(onChange).toHaveBeenCalledWith([]);
  rerender(<MultiSelect label="Visitas" ariaLabel="Visitas" value={[]} options={[{ value: "one", label: "Primera" }]} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Visitas" }).closest(".multi-select")?.className).toContain("multi-select--default");
});

test("golden navega con teclado, vuelve al disparador y se reposiciona dentro del viewport", async () => {
  const onChange = vi.fn();
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = () => ({ x: 350, y: 700, top: 700, left: 350, bottom: 744, right: 380, width: 30, height: 44, toJSON: () => ({}) }) as DOMRect;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
  render(<MultiSelect variant="golden" searchable label="Territorios" ariaLabel="Territorios" value={[]} options={territories} onChange={onChange} selectionNoun="territorios" />);
  const trigger = screen.getByRole("button", { name: "Territorios" });
  fireEvent.keyDown(trigger, { key: "ArrowUp" });
  const listbox = screen.getByRole("listbox", { name: "Territorios" });
  expect(listbox.dataset.placement).toBe("top");
  expect(Number.parseFloat(listbox.style.left)).toBeLessThanOrEqual(72);
  fireEvent.keyDown(listbox, { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith(["south"]);
  fireEvent.keyDown(listbox, { key: "Escape" });
  expect(screen.queryByRole("listbox", { name: "Territorios" })).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  fireEvent.click(trigger);
  fireEvent.scroll(window);
  fireEvent.resize(window);
  expect(screen.getByRole("listbox", { name: "Territorios" }).style.maxHeight).not.toBe("");
  HTMLElement.prototype.getBoundingClientRect = original;
});
