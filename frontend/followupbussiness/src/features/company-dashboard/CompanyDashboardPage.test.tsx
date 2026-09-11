import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { CompanyDashboardPage } from "./CompanyDashboardPage";
const state = vi.hoisted(() => ({ roles: ["COMPANY_ADMIN"] as string[] }));
vi.mock("../auth/auth", () => ({ getSessionCompanyLabel: () => "Empresa de prueba", getSessionIdentity: () => ({ roles: state.roles }) })); vi.mock("../../app/navigation", () => ({ navigate: vi.fn() })); afterEach(cleanup);
test("muestra el resumen y solo accesos disponibles para el rol actual", () => { const view = render(<CompanyDashboardPage />); expect(screen.getByRole("heading", { name: "Resumen" })).toBeTruthy(); expect(screen.getByRole("button", { name: /Carga de clientes/ })).toBeTruthy(); view.unmount(); state.roles = ["SUPERVISOR"]; render(<CompanyDashboardPage />); expect(screen.queryByRole("button", { name: /Carga de clientes/ })).toBeNull(); state.roles = ["COMPANY_ADMIN"]; });
