import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  DataTablePanel,
  DataTableResultsHeader,
  DataTableToolbar,
  SearchField,
} from "./DataTableWorkspace";
import { FilterField } from "./FilterField";

test("compone panel, toolbar, búsqueda, filtro y encabezado con el contrato compartido", () => {
  const onChange = vi.fn();
  render(
    <DataTablePanel ariaLabel="Listado de prueba">
      <DataTableToolbar filterCount={2}>
        <SearchField
          id="workspace-search"
          label="Buscar"
          value=""
          placeholder="Nombre"
          onChange={onChange}
        />
        <FilterField label="Estado"><button type="button">Todos</button></FilterField>
      </DataTableToolbar>
      <DataTableResultsHeader description="5 registros" />
    </DataTablePanel>,
  );

  const panel = screen.getByRole("region", { name: "Listado de prueba" });
  expect(panel.getAttribute("data-ui")).toBe("data-table-panel");
  expect(panel.querySelector('[data-ui="data-table-toolbar"]')).toBeTruthy();
  expect(panel.querySelector('[data-ui="search-field"]')).toBeTruthy();
  expect(panel.querySelector('[data-ui="filter-field"]')).toBeTruthy();
  expect(panel.querySelector('[data-ui="data-table-results-header"]')).toBeTruthy();

  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), {
    target: { value: "Ana" },
  });
  expect(onChange).toHaveBeenCalledWith("Ana");
});

test("mantiene composiciones compactas y habilita una densidad genérica", () => {
  const { rerender } = render(
    <DataTableToolbar filterCount={2}><span>Administradores</span></DataTableToolbar>,
  );
  expect(screen.getByText("Administradores").parentElement?.className).toContain("2-filters");

  rerender(
    <DataTableToolbar filterCount={3}><span>Vendedores</span></DataTableToolbar>,
  );
  expect(screen.getByText("Vendedores").parentElement?.className).toContain("3-filters");

  rerender(
    <DataTableToolbar filterCount={5}><span>Clientes</span></DataTableToolbar>,
  );
  const dense = screen.getByText("Clientes").parentElement!;
  expect(dense.className).toContain("dense");
  expect(dense.getAttribute("data-filter-count")).toBe("5");
  expect(dense.getAttribute("style")).toContain("--data-table-filter-count: 5");

  rerender(
    <DataTableToolbar filterCount={1}><span>Asignaciones</span></DataTableToolbar>,
  );
  expect(screen.getByText("Asignaciones").parentElement?.className).toContain("1-filters");
});
