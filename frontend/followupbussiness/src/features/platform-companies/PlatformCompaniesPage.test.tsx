import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PlatformCompaniesPage } from "./PlatformCompaniesPage";
import { CompanyActionDialog } from "./components/CompanyActionDialog";

const testState = vi.hoisted(() => ({
  identity: null as { id: string; displayName: string; roles: string[]; company: unknown } | null,
  listeners: new Set<() => void>(),
  listCompanies: vi.fn(),
  listCompanyCurrencies: vi.fn(),
  listCompanyAdminInvitations: vi.fn(),
  createCompany: vi.fn(),
  provisionInitialAdmin: vi.fn(),
  changeCompanyStatus: vi.fn(),
}));

vi.mock("../auth/auth", () => ({
  getSessionIdentity: () => testState.identity,
  subscribeToSession: (listener: () => void) => {
    testState.listeners.add(listener);
    return () => testState.listeners.delete(listener);
  },
  logout: vi.fn(),
}));

vi.mock("./api", () => ({
  listCompanies: testState.listCompanies,
  listCompanyCurrencies: testState.listCompanyCurrencies,
  listCompanyAdminInvitations: testState.listCompanyAdminInvitations,
  createCompany: testState.createCompany,
  provisionInitialAdmin: testState.provisionInitialAdmin,
  changeCompanyStatus: testState.changeCompanyStatus,
}));

const nova = {
  id: "company-1", legalName: "Nova", tradeName: null, code: "NOVA",
  timezone: "America/Lima", status: "ACTIVE" as const,
};
const suspendedNova = { ...nova, status: "SUSPENDED" as const };
const page = (items = [nova], currentPage = 0) => ({
  items,
  page: { page: currentPage, pageSize: 20, totalElements: 40, totalPages: 2 },
});
const response = (status: number, body?: unknown) => new Response(
  body === undefined ? null : JSON.stringify(body), { status },
);

async function renderLoaded() {
  render(<PlatformCompaniesPage />);
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  expect(screen.getByText("Nova")).toBeTruthy();
}

async function openStatusAction(label: "Suspender empresa" | "Reactivar empresa") {
  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Nova" }));
  fireEvent.click(screen.getByRole("menuitem", { name: label }));
  fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Incumplimiento operativo" } });
}

function selectCompanyStatus(label: "Activas" | "Suspendidas") {
  fireEvent.click(screen.getByRole("button", { name: "Filtrar empresas por estado" }));
  fireEvent.click(screen.getByRole("option", { name: label }));
}

beforeEach(() => {
  vi.useFakeTimers();
  testState.identity = { id: "platform-1", displayName: "Plataforma", roles: ["PLATFORM_SUPERADMIN"], company: null };
  testState.listCompanies.mockImplementation(async (filters: { page: number }) => ({ response: response(200), page: page([nova], filters.page) }));
  testState.listCompanyCurrencies.mockResolvedValue({ response: response(200), currencies: [{ code: "PEN", displayName: "Sol" }] });
  testState.listCompanyAdminInvitations.mockResolvedValue({ response: response(200), invitations: [] });
  testState.createCompany.mockResolvedValue({ response: response(201), company: nova });
  testState.provisionInitialAdmin.mockResolvedValue(response(202));
  testState.changeCompanyStatus.mockResolvedValue({ response: response(200), company: suspendedNova });
});

afterEach(() => {
  cleanup();
  testState.listeners.clear();
  Object.values(testState).forEach((value) => { if (value instanceof Function && "mockReset" in value) value.mockReset(); });
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("muestra carga, búsqueda y filtros de empresas", () => {
  render(<PlatformCompaniesPage />);
  expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Cargando empresas");
  expect(screen.getByRole("searchbox", { name: "Buscar empresa o código" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Filtrar empresas por estado" }).textContent).toContain("Todas");
  selectCompanyStatus("Activas");
  expect(screen.getByRole("button", { name: "Filtrar empresas por estado" }).textContent).toContain("Activas");
});

test("abre un formulario accesible para crear empresa", () => {
  render(<PlatformCompaniesPage />);
  fireEvent.click(screen.getByRole("button", { name: "Crear empresa" }));
  expect(screen.getByRole("dialog", { name: "Crear empresa" })).toBeTruthy();
  expect(screen.getByLabelText("Razón social").hasAttribute("required")).toBe(true);
});

test("cancela y bloquea el doble envío del cambio de estado", async () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<CompanyActionDialog company={nova} action="suspend" busy={false} error={null} onClose={onClose} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(onSubmit).not.toHaveBeenCalled();
  cleanup();

  let resolvePending!: (result: { response: Response; company: typeof suspendedNova }) => void;
  const pending = new Promise<{ response: Response; company: typeof suspendedNova }>((resolve) => {
    resolvePending = resolve;
  });
  testState.changeCompanyStatus.mockReturnValueOnce(pending);
  await renderLoaded();
  await openStatusAction("Suspender empresa");
  const submit = screen.getByRole("button", { name: "Suspender empresa" });
  fireEvent.click(submit);
  await act(async () => {});
  expect(screen.getByRole("dialog", { name: "Suspendiendo empresa" })).toBeTruthy();
  fireEvent.click(submit);
  expect(testState.changeCompanyStatus).toHaveBeenCalledTimes(1);
  resolvePending({ response: response(200), company: suspendedNova });
  await act(async () => {});
  expect(screen.getByRole("dialog", { name: "Empresa suspendida" })).toBeTruthy();
  expect(screen.getByText("Suspendida")).toBeTruthy();
});

test("actualiza ACTIVE a SUSPENDED y SUSPENDED a ACTIVE solo tras 200", async () => {
  await renderLoaded();
  await openStatusAction("Suspender empresa");
  fireEvent.click(screen.getByRole("button", { name: "Suspender empresa" }));
  await act(async () => {});
  expect(testState.changeCompanyStatus).toHaveBeenLastCalledWith("company-1", { status: "SUSPENDED", reason: "Incumplimiento operativo" });
  expect(screen.getByText("Suspendida")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Más acciones para Nova" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Reactivar empresa" }));
  fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Servicio regularizado" } });
  testState.changeCompanyStatus.mockResolvedValueOnce({ response: response(200), company: nova });
  fireEvent.click(screen.getByRole("button", { name: "Reactivar empresa" }));
  await act(async () => {});
  expect(screen.getByText("Activa")).toBeTruthy();
});

describe.each([
  [401, "Tu sesión ya no es válida"], [403, "No tienes permisos"], [404, "ya no está disponible"], [409, "El estado cambió antes"], [500, "No fue posible actualizar"],
])("respuesta %i", (status, message) => {
  test("no presenta éxito local y conserva la acción para reintentar", async () => {
    testState.changeCompanyStatus.mockResolvedValueOnce({ response: response(status, { correlationId: "corr-1" }), company: null });
    await renderLoaded();
    await openStatusAction("Suspender empresa");
    fireEvent.click(screen.getByRole("button", { name: "Suspender empresa" }));
    await act(async () => {});
    expect(screen.getByText(message, { exact: false })).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Suspender empresa" })).toBeTruthy();
    expect(screen.getByText("Activa")).toBeTruthy();
  });
});

test("descarta una respuesta obsoleta y limpia diálogo y envío ante cambio de sesión", async () => {
  let resolvePending!: (result: { response: Response; company: typeof suspendedNova }) => void;
  const pending = new Promise<{ response: Response; company: typeof suspendedNova }>((resolve) => {
    resolvePending = resolve;
  });
  testState.changeCompanyStatus.mockReturnValueOnce(pending);
  await renderLoaded();
  await openStatusAction("Suspender empresa");
  fireEvent.click(screen.getByRole("button", { name: "Suspender empresa" }));
  await act(async () => {});
  testState.identity = { id: "platform-2", displayName: "Otra sesión", roles: ["PLATFORM_SUPERADMIN"], company: "other" };
  await act(async () => { testState.listeners.forEach((listener) => listener()); });
  expect(screen.queryByRole("dialog", { name: "Suspender empresa" })).toBeNull();
  resolvePending({ response: response(200), company: suspendedNova });
  await act(async () => {});
  expect(screen.queryByText("Suspendida")).toBeNull();
});

test("conserva búsqueda, filtro y página después del 200", async () => {
  await renderLoaded();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar empresa o código" }), { target: { value: "Nova" } });
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  selectCompanyStatus("Activas");
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  await openStatusAction("Suspender empresa");
  fireEvent.click(screen.getByRole("button", { name: "Suspender empresa" }));
  await act(async () => {});
  expect((screen.getByRole("searchbox", { name: "Buscar empresa o código" }) as HTMLInputElement).value).toBe("Nova");
  expect(screen.getByRole("button", { name: "Filtrar empresas por estado" }).textContent).toContain("Activas");
  expect(screen.getByRole("button", { name: "Página 2" })).toBeTruthy();
  expect(screen.getByText("Suspendida")).toBeTruthy();
});

test("conserva el provisionamiento inicial tras crear empresa", async () => {
  await renderLoaded();
  fireEvent.click(screen.getByRole("button", { name: "Crear empresa" }));
  fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Nova" } });
  fireEvent.click(screen.getByRole("button", { name: "Moneda" }));
  fireEvent.click(screen.getByRole("option", { name: "PEN — Sol" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Crear empresa" })).getByRole("button", { name: "Crear empresa" }));
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Ana Admin" } });
  fireEvent.change(screen.getByLabelText("Correo corporativo"), { target: { value: "ana@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));
  await act(async () => {});
  expect(testState.provisionInitialAdmin).toHaveBeenCalledWith("company-1", { displayName: "Ana Admin", email: "ana@example.com" });
  expect(screen.getByText("Empresa creada e invitación programada")).toBeTruthy();
});
