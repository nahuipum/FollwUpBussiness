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
      onClose={() => undefined}
      onRetryOptions={() => undefined}
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
      onClose={() => undefined}
      onRetryOptions={() => undefined}
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

test("muestra el error de carga de opciones sin una acción de recarga de mutación", () => {
  render(
    <SellerFormDialog
      seller={null}
      options={{ supervisors: [], territories: [] }}
      loadingOptions={false}
      busy={false}
      error="No pudimos cargar las opciones."
      onClose={() => undefined}
      onRetryOptions={() => undefined}
      onSubmit={() => undefined}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("No pudimos cargar las opciones.");
});
