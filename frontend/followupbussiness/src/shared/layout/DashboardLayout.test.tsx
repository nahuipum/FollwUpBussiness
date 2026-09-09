import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { themeStorageKey } from "../theme/theme";
import { DashboardLayout } from "./DashboardLayout";

function renderLayout() {
  return render(
    <DashboardLayout
      brand={<span>FollowUpBussiness</span>}
      contextLabel="Empresa"
      navigationLabel="Navegación"
      navigation={[]}
      profile={{ initials: "LP", name: "Luis Pérez", role: "Administrador" }}
      breadcrumbs={["Inicio"]}
      onLogout={vi.fn()}
    >
      <p>Contenido</p>
    </DashboardLayout>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(themeStorageKey);
  delete document.documentElement.dataset.theme;
  document.documentElement.style.removeProperty("color-scheme");
});

test("activa y desactiva el modo oscuro desde el encabezado", () => {
  renderLayout();

  const themeOption = screen.getByRole("switch", { name: /Modo oscuro/ });

  expect(themeOption.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(themeOption);
  expect(themeOption.getAttribute("aria-checked")).toBe("true");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.style.colorScheme).toBe("dark");
  expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");

  fireEvent.click(themeOption);
  expect(themeOption.getAttribute("aria-checked")).toBe("false");
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(window.localStorage.getItem(themeStorageKey)).toBe("light");
});

test("restaura la preferencia guardada y cierra el menú de perfil con Escape", () => {
  window.localStorage.setItem(themeStorageKey, "dark");
  renderLayout();

  const themeOption = screen.getByRole("switch", { name: /Modo oscuro/ });
  expect(themeOption.getAttribute("aria-checked")).toBe("true");
  expect(document.documentElement.dataset.theme).toBe("dark");

  const profileButton = screen.getByRole("button", { name: "Abrir opciones del perfil de Luis Pérez" });
  fireEvent.click(profileButton);

  fireEvent.keyDown(screen.getByRole("menuitem", { name: "Cerrar sesión" }), { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(profileButton);
});

test("admite grupos desplegables sin confundir la acción del grupo con sus rutas", () => {
  const selectManagement = vi.fn();
  render(<DashboardLayout brand={<span>FollowUpBussiness</span>} contextLabel="Empresa" navigationLabel="Navegación" navigation={[{ id: "clients", label: "Clientes", icon: <span>Icono</span>, children: [{ id: "management", label: "Gestión de clientes", icon: <span>Lista</span>, onSelect: selectManagement }, { id: "map", label: "Mapa general", icon: <span>Mapa</span>, disabled: true }]}]} profile={{ initials: "LP", name: "Luis Pérez", role: "Administrador" }} breadcrumbs={["Inicio"]}>Contenido</DashboardLayout>);
  const group = screen.getByRole("button", { name: "Clientes" });
  expect(group.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(group);
  expect(group.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Gestión de clientes" }));
  expect(selectManagement).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: /Mapa general/ })).toHaveProperty("disabled", true);
});
