import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PlatformCompaniesPage } from "./PlatformCompaniesPage";

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

test("muestra carga, búsqueda y filtros de empresas", () => {
  render(<PlatformCompaniesPage />);
  expect(screen.getByRole("status").textContent).toBe("Cargando empresas…");
  expect(screen.getByRole("searchbox", { name: "Buscar empresa o código" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Todas" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Activas" }));
  expect(screen.getByRole("button", { name: "Activas" }).getAttribute("aria-pressed")).toBe("true");
});

test("abre un formulario accesible para crear empresa", () => {
  render(<PlatformCompaniesPage />);
  fireEvent.click(screen.getByRole("button", { name: "Crear empresa" }));
  expect(screen.getByRole("dialog", { name: "Crear empresa" })).toBeTruthy();
  expect(screen.getByLabelText("Razón social").hasAttribute("required")).toBe(true);
  expect(screen.queryByLabelText("Código de empresa")).toBeNull();
  expect(screen.getByText("Configuración inicial: radio de geocerca 100 m y tracking cada 60 s.")).toBeTruthy();
});
