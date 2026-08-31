import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { MultiSelect } from "./MultiSelect";

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
