import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { DataTable, DataTablePagination, DataTableStatus } from "./DataTable";

afterEach(cleanup);

const columns = [{
  id: "name",
  header: "Nombre",
  label: "Nombre",
  render: (item: { id: string; name: string }) => item.name,
}] as const;
const items = [{ id: "ana", name: "Ana" }];

test("mantiene la apariencia default como opción explícita", () => {
  render(<><DataTable ariaLabel="Tabla de prueba" items={items} columns={columns} rowKey={(item) => item.id} /><DataTableStatus label="Activo" tone="success" /></>);
  expect(screen.getByRole("table", { name: "Tabla de prueba" }).className).toContain("data-table--default");
  expect(screen.getByText("Activo").parentElement?.className).toContain("data-table__status--success");
});

test("aplica golden solo cuando se solicita, incluida la paginación", () => {
  render(<><DataTable ariaLabel="Tabla golden" items={items} columns={columns} rowKey={(item) => item.id} variant="golden" /><DataTablePagination page={0} totalPages={4} pageSize={5} onPageChange={() => undefined} onPageSizeChange={() => undefined} ariaLabel="Paginación de prueba" summary="Mostrando 1–5 de 20 usuarios" lastUpdated={new Date("2026-09-10T10:42:00-05:00")} variant="golden" /></>);
  expect(screen.getByRole("table", { name: "Tabla golden" }).className).toContain("data-table--golden");
  expect(screen.getByRole("contentinfo").className).toContain("data-table__pagination--golden");
  expect(screen.getByRole("button", { name: "Registros por página" }).closest(".visual-select")?.className).toContain("visual-select--golden");
  expect(screen.getByRole("status").textContent).toMatch(/^Actualizado hoy, \d{2}:\d{2}$/);
  expect(screen.getByRole("contentinfo").className).toContain("data-table__pagination--golden");
});

function renderPagination(page: number, totalPages: number) {
  render(<DataTablePagination page={page} totalPages={totalPages} pageSize={5} onPageChange={() => undefined} onPageSizeChange={() => undefined} ariaLabel="Paginación de prueba" />);
}

test("muestra primera, elipsis y última en la primera página", () => {
  renderPagination(0, 26);
  expect(screen.getByRole("button", { name: "Página 1" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByText("…")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Página 26" })).not.toBeNull();
});

test("muestra ambas elipsis alrededor de una página intermedia", () => {
  renderPagination(12, 26);
  expect(screen.getAllByText("…")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Página 13" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("button", { name: "Página 1" })).not.toBeNull();
  expect(screen.getByRole("button", { name: "Página 26" })).not.toBeNull();
});

test("muestra primera, elipsis y última activa en la última página", () => {
  renderPagination(25, 26);
  expect(screen.getByRole("button", { name: "Página 1" })).not.toBeNull();
  expect(screen.getByText("…")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Página 26" }).getAttribute("aria-current")).toBe("page");
});

test("no muestra elipsis cuando hay una sola página", () => {
  renderPagination(0, 1);
  expect(screen.queryByText("…")).toBeNull();
  expect(screen.getByRole("button", { name: "Página 1" }).getAttribute("aria-current")).toBe("page");
  expect((screen.getByRole("button", { name: "Página anterior" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Página siguiente" }) as HTMLButtonElement).disabled).toBe(true);
});
