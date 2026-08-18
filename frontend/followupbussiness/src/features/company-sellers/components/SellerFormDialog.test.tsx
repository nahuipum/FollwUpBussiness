import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SellerFormDialog } from "./SellerFormDialog";

afterEach(() => document.body.replaceChildren());

test("envía los datos normalizados y evita doble envío mientras guarda", () => {
  const submit = vi.fn();
  render(
    <SellerFormDialog
      seller={null}
      options={{
        supervisors: [{ id: "supervisor-1", displayName: "Sofía" }],
        territories: [{ id: "territory-1", code: "LIM", name: "Lima" }],
      }}
      loadingOptions={false}
      busy={false}
      error={null}
      conflict={false}
      onClose={() => undefined}
      onRetryOptions={() => undefined}
      onReload={() => undefined}
      onSubmit={submit}
    />,
  );
  fireEvent.change(screen.getByLabelText("Nombre completo"), {
    target: { value: " Ana " },
  });
  fireEvent.change(screen.getByLabelText("Correo corporativo"), {
    target: { value: "ana@example.com" },
  });
  fireEvent.click(screen.getByLabelText("LIM — Lima"));
  fireEvent.click(screen.getByRole("button", { name: "Crear vendedor" }));
  expect(submit).toHaveBeenCalledWith(
    expect.objectContaining({
      displayName: "Ana",
      territoryIds: ["territory-1"],
    }),
  );
});

test("muestra un estado recuperable cuando las opciones no cargan", () => {
  render(
    <SellerFormDialog
      seller={null}
      options={null}
      loadingOptions={false}
      busy={false}
      error={null}
      conflict={false}
      onClose={() => undefined}
      onRetryOptions={() => undefined}
      onReload={() => undefined}
      onSubmit={() => undefined}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain(
    "No pudimos cargar las opciones de asignación.",
  );
  expect(
    (screen.getByRole("button", { name: "Reintentar" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

test("ofrece recargar un conflicto sin perder los campos escritos", () => {
  const reload = vi.fn();
  render(
    <SellerFormDialog
      seller={null}
      options={{ supervisors: [], territories: [] }}
      loadingOptions={false}
      busy={false}
      error="Los datos cambiaron."
      conflict
      onClose={() => undefined}
      onRetryOptions={() => undefined}
      onReload={reload}
      onSubmit={() => undefined}
    />,
  );
  fireEvent.change(screen.getByLabelText("Nombre completo"), {
    target: { value: "Ana" },
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "Recargar listado y conservar formulario",
    }),
  );
  expect(reload).toHaveBeenCalledOnce();
  expect(
    (screen.getByLabelText("Nombre completo") as HTMLInputElement).value,
  ).toBe("Ana");
});
