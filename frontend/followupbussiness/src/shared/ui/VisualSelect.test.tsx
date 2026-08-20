import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test } from "vitest";
import { VisualSelect } from "./VisualSelect";

const options = [
  { value: "A", label: "Primera" },
  { value: "B", label: "Deshabilitada", disabled: true },
  { value: "C", label: "Tercera" },
] as const;

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function SelectExample() {
  const [value, setValue] = useState<(typeof options)[number]["value"]>("A");
  return (
    <VisualSelect
      value={value}
      options={options}
      onChange={setValue}
      ariaLabel="Opción de prueba"
    />
  );
}

test("abre con Enter, navega opciones habilitadas y selecciona con Enter", () => {
  render(<SelectExample />);
  const trigger = screen.getByRole("button", { name: "Opción de prueba" });

  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(trigger.getAttribute("aria-activedescendant")).toBe(
    screen.getByRole("option", { name: "Primera" }).id,
  );

  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(trigger.getAttribute("aria-activedescendant")).toBe(
    screen.getByRole("option", { name: "Tercera" }).id,
  );
  fireEvent.keyDown(trigger, { key: "Enter" });

  expect(trigger.textContent).toContain("Tercera");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
});

test("abre con flechas, soporta Home y End, y Escape cierra sin cambiar", () => {
  render(<SelectExample />);
  const trigger = screen.getByRole("button", { name: "Opción de prueba" });

  fireEvent.keyDown(trigger, { key: "ArrowUp" });
  expect(trigger.getAttribute("aria-activedescendant")).toBe(
    screen.getByRole("option", { name: "Primera" }).id,
  );
  fireEvent.keyDown(trigger, { key: "End" });
  expect(trigger.getAttribute("aria-activedescendant")).toBe(
    screen.getByRole("option", { name: "Tercera" }).id,
  );
  fireEvent.keyDown(trigger, { key: "Home" });
  expect(trigger.getAttribute("aria-activedescendant")).toBe(
    screen.getByRole("option", { name: "Primera" }).id,
  );
  fireEvent.keyDown(trigger, { key: "Escape" });

  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(trigger.textContent).toContain("Primera");
});

test("abre con Espacio y permite elegir con flecha y Espacio", () => {
  render(<SelectExample />);
  const trigger = screen.getByRole("button", { name: "Opción de prueba" });

  fireEvent.keyDown(trigger, { key: " " });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  fireEvent.keyDown(trigger, { key: " " });

  expect(trigger.textContent).toContain("Tercera");
  expect(screen.queryByRole("listbox")).toBeNull();
});
