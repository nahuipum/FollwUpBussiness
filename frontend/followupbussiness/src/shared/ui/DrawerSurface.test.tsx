import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, expect, test } from "vitest";
import { DrawerSurface } from "./DrawerSurface";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return <><button ref={triggerRef} type="button" onClick={() => setOpen(true)}>Abrir drawer</button>{open && <DrawerSurface titleId="drawer-title" onDismiss={() => setOpen(false)} initialFocusRef={triggerRef} header={<h2 id="drawer-title">Drawer de prueba</h2>} footer={<button type="button" onClick={() => setOpen(false)}>Cerrar drawer</button>}><p>Contenido desplazable</p></DrawerSurface>}</>;
}

test("porta el drawer y conserva header, body y footer como regiones hermanas", () => {
  const { container } = render(<DrawerHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir drawer" }));
  const dialog = screen.getByRole("dialog", { name: "Drawer de prueba" });
  expect(container.contains(dialog)).toBe(false);
  expect(Array.from(dialog.children).map((element) => element.className)).toEqual(["drawer-surface__header", "drawer-surface__body", "drawer-surface__footer"]);
  expect(dialog.querySelector(".drawer-surface__body")?.textContent).toContain("Contenido desplazable");
});

test("bloquea el scroll y devuelve el foco al disparador al cerrar", () => {
  render(<DrawerHarness />);
  const trigger = screen.getByRole("button", { name: "Abrir drawer" });
  fireEvent.click(trigger);
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.click(screen.getByRole("button", { name: "Cerrar drawer" }));
  expect(document.body.style.overflow).toBe("");
  expect(document.activeElement).toBe(trigger);
});
