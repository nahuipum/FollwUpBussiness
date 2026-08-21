import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CompanyUsersPageRoute } from "./CompanyUsersPageRoute";
import { CompanyWorkspaceLayout } from "../../app/components/CompanyWorkspaceLayout";

const state = vi.hoisted(() => ({
  identity: { id: "admin", displayName: "Ana", company: "company-a", roles: ["COMPANY_ADMIN"] },
  listeners: new Set<() => void>(), list: vi.fn(), get: vi.fn(), invite: vi.fn(), update: vi.fn(), resend: vi.fn(), status: vi.fn(),
}));
vi.mock("./api", () => ({ listCompanyUsers: state.list, getCompanyUser: state.get, inviteCompanyUser: state.invite, updateCompanyUser: state.update, correctAndResendCompanyUserInvitation: state.resend, updateCompanyUserStatus: state.status }));
vi.mock("../auth/auth", () => ({ getSessionIdentity: () => state.identity, getSessionCompanyLabel: () => null, subscribeToSession: (listener: () => void) => { state.listeners.add(listener); return () => state.listeners.delete(listener); }, logout: vi.fn() }));
const user = { id: "u1", displayName: "Ana Gómez", email: "ana@example.com", username: null, role: "SUPERVISOR" as const, status: "ACTIVE" as const, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 3 };
const invitedUser = { ...user, id: "u2", displayName: "Carla Pérez", email: "carla@example.com", status: "INVITED" as const, version: 4 };
const response = (status: number) => new Response(null, { status });
beforeEach(() => { vi.useFakeTimers(); state.identity = { id: "admin", displayName: "Ana", company: "company-a", roles: ["COMPANY_ADMIN"] }; state.list.mockResolvedValue({ response: response(200), page: { items: [user], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } } }); state.get.mockResolvedValue({ response: response(200), user }); state.invite.mockResolvedValue({ response: response(202), user }); state.update.mockResolvedValue({ response: response(200), user }); state.status.mockResolvedValue({ response: response(200), user: { ...user, status: "LOCKED" } }); });
afterEach(() => { cleanup(); state.listeners.clear(); Object.values(state).forEach((value) => { if (typeof value === "function" && "mockReset" in value) (value as ReturnType<typeof vi.fn>).mockReset(); }); vi.useRealTimers(); });
async function loaded() { render(<CompanyWorkspaceLayout workspace="company" activeSection="administrators-supervisors"><CompanyUsersPageRoute /></CompanyWorkspaceLayout>); await act(async () => { await vi.advanceTimersByTimeAsync(250); }); }
test("carga la lista real con filtros contractuales", async () => { await loaded(); expect(screen.getByText("Ana Gómez")).toBeTruthy(); fireEvent.click(screen.getByRole("button", { name: "Rol" })); fireEvent.click(screen.getByRole("option", { name: "Administrador" })); await act(async () => { await vi.advanceTimersByTimeAsync(250); }); expect(state.list).toHaveBeenLastCalledWith(expect.objectContaining({ role: "COMPANY_ADMIN" })); });
test("mantiene Asignar cartera inmediatamente después de Clientes en navegación de usuarios", async () => { await loaded(); const navigation = screen.getByRole("complementary", { name: "Navegación principal" }).querySelector(".dashboard-nav"); const items = Array.from(navigation?.querySelectorAll(".dashboard-nav__item") ?? []).map((item) => item.textContent); expect(items).toEqual(["Resumen", "Administradores y supervisores", "Vendedores", "Zonas", "Clientes", "Asignar cartera", "Auditoría", "Configuración"]); });
test("invita con rol permitido y no anuncia éxito ante conflicto", async () => { await loaded(); fireEvent.click(screen.getByRole("button", { name: "Invitar administrador o supervisor" })); fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Luis Pérez" } }); fireEvent.change(screen.getByLabelText("Correo corporativo"), { target: { value: "luis@example.com" } }); fireEvent.click(screen.getByRole("radio", { name: /Administrador/ })); fireEvent.click(screen.getByRole("button", { name: "Enviar invitación" })); await act(async () => {}); expect(state.invite).toHaveBeenCalledWith({ displayName: "Luis Pérez", email: "luis@example.com", role: "COMPANY_ADMIN" }); });
test("mantiene foco en campo de invitación al escribir", async () => { await loaded(); fireEvent.click(screen.getByRole("button", { name: "Invitar administrador o supervisor" })); const name = screen.getByLabelText("Nombre completo"); name.focus(); fireEvent.change(name, { target: { value: "S" } }); expect(document.activeElement).toBe(name); fireEvent.change(name, { target: { value: "Sa" } }); expect(document.activeElement).toBe(name); });
test("corrige y reenvía sólo una invitación pendiente, sin afirmar la entrega", async () => {
  state.list.mockResolvedValue({ response: response(200), page: { items: [user, invitedUser], page: { page: 0, pageSize: 20, totalElements: 2, totalPages: 1 } } });
  const updatedInvitation = { ...invitedUser, email: "carla.nueva@example.com", version: 5 };
  state.resend.mockResolvedValue({ response: response(202), user: updatedInvitation });
  await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Carla Pérez" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Corregir y reenviar invitación" }));
  expect(screen.getByRole("heading", { name: "Corregir y reenviar invitación" })).toBeTruthy();
  expect((screen.getByLabelText("Correo corporativo") as HTMLInputElement).value).toBe("carla@example.com");
  fireEvent.change(screen.getByLabelText("Correo corporativo"), { target: { value: "carla.nueva@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Corregir y reenviar invitación" }));
  await act(async () => {});
  expect(state.resend).toHaveBeenCalledWith(invitedUser, expect.objectContaining({ email: "carla.nueva@example.com" }));
  expect(screen.getByText("La nueva entrega de invitación fue aceptada.")).toBeTruthy();
  expect(screen.queryByText(/entregada/i)).toBeNull();
  expect(state.list).toHaveBeenCalledTimes(1);
});
test("no anuncia éxito si el reenvío entra en conflicto y limpia el diálogo al cambiar sesión", async () => {
  state.list.mockResolvedValue({ response: response(200), page: { items: [invitedUser], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } } });
  state.resend.mockResolvedValue({ response: response(409), user: null });
  await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Carla Pérez" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Corregir y reenviar invitación" }));
  fireEvent.click(screen.getByRole("button", { name: "Corregir y reenviar invitación" }));
  await act(async () => {});
  expect(screen.getByText(/cambiaron o entran en conflicto/i).textContent).toMatch(/cambiaron o entran en conflicto/i);
  expect(screen.queryByText("La nueva entrega de invitación fue aceptada.")).toBeNull();
  state.identity = { id: "other", displayName: "Otra", company: "company-b", roles: ["COMPANY_ADMIN"] };
  await act(async () => { state.listeners.forEach((listener) => listener()); });
  expect(screen.queryByRole("dialog")).toBeNull();
});
test("bloquea cancelar y el doble envío mientras procesa el reenvío", async () => {
  state.list.mockResolvedValue({ response: response(200), page: { items: [invitedUser], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } } });
  let complete: ((value: { response: Response; user: typeof invitedUser }) => void) | undefined;
  state.resend.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
  await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Carla Pérez" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Corregir y reenviar invitación" }));
  fireEvent.click(screen.getByRole("button", { name: "Corregir y reenviar invitación" }));
  await act(async () => {});
  expect((screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Guardando…" }));
  expect(state.resend).toHaveBeenCalledTimes(1);
  await act(async () => { complete?.({ response: response(202), user: invitedUser }); });
});
test("bloquea solo tras confirmación y limpia datos tras cambio de sesión", async () => { await loaded(); fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana Gómez" })); fireEvent.click(screen.getByRole("menuitem", { name: "Bloquear usuario" })); fireEvent.click(screen.getByRole("button", { name: "Bloquear usuario" })); await act(async () => {}); expect(state.status).toHaveBeenCalledWith(user, "LOCKED"); state.identity = { id: "other", displayName: "Otra", company: "company-b", roles: ["COMPANY_ADMIN"] }; await act(async () => { state.listeners.forEach((listener) => listener()); }); expect(screen.queryByText("Ana Gómez")).toBeNull(); });
test("la confirmación de estado atrapa el foco y se cierra con Escape", async () => { await loaded(); const trigger = screen.getByRole("button", { name: "Más acciones para Ana Gómez" }); fireEvent.click(trigger); fireEvent.click(screen.getByRole("menuitem", { name: "Bloquear usuario" })); const cancel = screen.getByRole("button", { name: "Cancelar" }); const confirm = screen.getByRole("button", { name: "Bloquear usuario" }); expect(document.activeElement).toBe(cancel); confirm.focus(); fireEvent.keyDown(document, { key: "Tab" }); expect(document.activeElement).toBe(cancel); fireEvent.keyDown(document, { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull(); expect(document.activeElement).toBe(trigger); });
test("cierra acciones al hacer clic fuera del menú", async () => { await loaded(); fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana Gómez" })); expect(screen.getByRole("menu")).toBeTruthy(); fireEvent.pointerDown(document.body); expect(screen.queryByRole("menu")).toBeNull(); });
test("muestra detalle y supervisor solo puede acceder a esa acción", async () => { state.identity = { id: "supervisor", displayName: "Sofía", company: "company-a", roles: ["SUPERVISOR"] }; await loaded(); fireEvent.click(screen.getByRole("button", { name: "Más acciones para Ana Gómez" })); expect(screen.getByRole("menuitem", { name: "Ver detalle" })).toBeTruthy(); expect(screen.queryByRole("menuitem", { name: "Editar usuario" })).toBeNull(); fireEvent.click(screen.getByRole("menuitem", { name: "Ver detalle" })); await act(async () => {}); expect(state.get).toHaveBeenCalledWith("u1"); expect(screen.getByText("Detalle de usuario")).toBeTruthy(); });
