import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { CompanyWorkspaceLayout } from "./CompanyWorkspaceLayout";

const state = vi.hoisted(() => ({ roles: ["SUPERVISOR"] as string[] }));
vi.mock("../../features/auth/auth", () => ({
  getSessionCompanyLabel: () => "Empresa de prueba",
  getSessionIdentity: () => ({ displayName: "Usuario de prueba", roles: state.roles }),
  logout: vi.fn(),
}));

afterEach(cleanup);

test("muestra Carga de clientes únicamente al administrador en la navegación de empresa", () => {
  const view = render(<CompanyWorkspaceLayout workspace="company" activeSection="dashboard"><p>Contenido</p></CompanyWorkspaceLayout>);
  fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
  expect(screen.queryByRole("button", { name: "Carga de clientes" })).toBeNull();

  view.unmount();
  state.roles = ["COMPANY_ADMIN"];
  render(<CompanyWorkspaceLayout workspace="company" activeSection="dashboard"><p>Contenido</p></CompanyWorkspaceLayout>);
  fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
  expect(screen.getByRole("button", { name: "Carga de clientes" })).toBeTruthy();
  state.roles = ["SUPERVISOR"];
});
