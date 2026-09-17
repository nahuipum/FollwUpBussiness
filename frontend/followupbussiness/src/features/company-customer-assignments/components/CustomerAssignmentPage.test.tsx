import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ApiError } from "../../../lib/api";
import { CustomerAssignmentPage } from "./CustomerAssignmentPage";

const state = vi.hoisted(() => ({
  identity: { id: "admin-1", company: { id: "tenant-1" }, roles: ["COMPANY_ADMIN"] },
  listener: undefined as (() => void) | undefined,
  submit: vi.fn(),
  reload: vi.fn(),
  clearResults: vi.fn(),
  data: {
    clients: [] as Array<{ id: string; name: string; status: "ACTIVE"; territoryId: string | null; assignedSellerIds: string[] }>,
    sellers: [] as Array<{ id: string; displayName: string; status: "ACTIVE" }>,
    territories: [] as Array<{ id: string; name: string; status: "ACTIVE" }>,
    loading: false,
    error: null as ApiError | null,
    lastUpdated: null as Date | null,
    results: [] as Array<{ customerId: string; status: "ASSIGNED" | "REJECTED"; errorCode: string | null }>,
    reload: vi.fn(),
    submit: vi.fn(),
    clearResults: vi.fn(),
  },
}));

vi.mock("../../auth/auth", () => ({
  getSessionIdentity: () => state.identity,
  subscribeToSession: (listener: () => void) => { state.listener = listener; return () => { state.listener = undefined; }; },
}));
vi.mock("../hooks/useCustomerAssignments", () => ({ useCustomerAssignments: () => state.data }));

const clients = Array.from({ length: 7 }, (_, index) => ({
  id: `client-${index + 1}`,
  name: `Cliente ${index + 1}`,
  status: "ACTIVE" as const,
  territoryId: index % 2 ? "territory-2" : "territory-1",
  assignedSellerIds: index === 0 ? ["seller-current"] : [],
}));

beforeEach(() => {
  state.identity = { id: "admin-1", company: { id: "tenant-1" }, roles: ["COMPANY_ADMIN"] };
  state.listener = undefined;
  state.data.clients = clients;
  state.data.sellers = [{ id: "seller-new", displayName: "Lucía Calderón", status: "ACTIVE" }, { id: "seller-current", displayName: "Rosa Torres", status: "ACTIVE" }];
  state.data.territories = [{ id: "territory-1", name: "Lima Centro", status: "ACTIVE" }, { id: "territory-2", name: "Lima Norte", status: "ACTIVE" }];
  state.data.loading = false;
  state.data.error = null;
  state.data.results = [];
  state.data.submit = vi.fn().mockResolvedValue(true);
  state.data.reload = vi.fn();
  state.data.clearResults = vi.fn();
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "11111111-1111-4111-8111-111111111111") });
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.replaceChildren(); });

test("bloquea la capacidad a quien no es COMPANY_ADMIN", () => {
  state.identity = { id: "seller-1", company: { id: "tenant-1" }, roles: ["SELLER"] };
  render(<CustomerAssignmentPage />);
  expect(screen.getByRole("heading", { name: "No tienes permisos" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Continuar a clientes" })).toBeNull();
});
test("403 revocado oculta cartera y descarta la selección anterior", async () => {
  const view = render(<CustomerAssignmentPage />);
  configureAndContinue();
  fireEvent.click(screen.getByRole("button", { name: "Agregar Cliente 1 a la asignación" }));
  expect(screen.getByText("1 cliente seleccionado")).toBeTruthy();
  state.data.error = { status: 403, correlationId: null, fieldErrors: [] };
  view.rerender(<CustomerAssignmentPage />);
  expect(screen.getByRole("heading", { name: "No tienes permisos" })).toBeTruthy();
  expect(screen.queryByText("Cliente 1")).toBeNull();
  expect(screen.queryByRole("button", { name: "Confirmar operación" })).toBeNull();
  state.data.error = null;
  view.rerender(<CustomerAssignmentPage />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Continuar a clientes" })).toBeTruthy());
  expect(screen.queryByText("1 cliente seleccionado")).toBeNull();
});

test("valida el paso 1 y conserva responsables, fecha y motivo al volver", () => {
  render(<CustomerAssignmentPage />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar a clientes" }));
  expect(screen.getByText("Selecciona al menos un responsable activo.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Nuevos responsables" }).getAttribute("aria-describedby")).toBe("assignment-sellers-error");
  configure();
  fireEvent.change(screen.getByRole("textbox", { name: "Motivo (opcional)" }), { target: { value: "Redistribución por cobertura" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuar a clientes" }));
  expect(screen.getByRole("heading", { name: "2. Buscar y agregar clientes" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Volver a configuración" }));
  expect(screen.getByRole("button", { name: "Nuevos responsables" }).textContent).toContain("Lucía Calderón");
  expect((screen.getByRole("textbox", { name: "Motivo (opcional)" }) as HTMLTextAreaElement).value).toBe("Redistribución por cobertura");
  expect(screen.getByText(/de 500 caracteres/).textContent).toContain("28");
});

test("agrega y quita con acciones explícitas, conserva selección entre página y filtro y revisa responsables", () => {
  render(<CustomerAssignmentPage />);
  configureAndContinue();
  expect(screen.queryByRole("checkbox")).toBeNull();
  const add = screen.getByRole("button", { name: "Agregar Cliente 1 a la asignación" });
  expect(add.querySelector("svg")).toBeTruthy();
  expect(add.textContent).toBe("");
  fireEvent.click(add);
  expect(screen.getByText("1 cliente seleccionado")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Agregar esta página (2)" }));
  expect(screen.getByText("3 clientes seleccionados")).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar clientes" }), { target: { value: "Cliente 2" } });
  expect(screen.getByText("3 clientes seleccionados")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continuar a revisión" }));
  expect(screen.getByText("Rosa Torres", { selector: ".customer-assignment__comparison-row span" })).toBeTruthy();
  expect(screen.getAllByText("Lucía Calderón").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Volver a clientes" }));
  const remove = screen.getByRole("button", { name: "Quitar Cliente 1" });
  expect(remove.querySelector("svg")).toBeTruthy();
  fireEvent.click(remove);
  expect(screen.getByText("2 clientes seleccionados")).toBeTruthy();
});

test("marca sin cambios y excluye del lote al cliente que ya tiene los nuevos responsables", () => {
  render(<CustomerAssignmentPage />);
  fireEvent.click(screen.getByRole("button", { name: "Nuevos responsables" }));
  fireEvent.click(screen.getByRole("option", { name: "Rosa Torres" }));
  fireEvent.keyDown(screen.getByRole("listbox", { name: "Nuevos responsables" }), { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Vigente desde" }));
  fireEvent.click(document.querySelector<HTMLButtonElement>('.date-filter__days button[aria-current="date"]')!);
  fireEvent.click(screen.getByRole("button", { name: "Continuar a clientes" }));
  expect(screen.getByText("Sin cambios")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Agregar Cliente 1 a la asignación" })).toBeNull();
  expect(screen.getByRole("button", { name: "Agregar esta página (4)" })).toBeTruthy();
});

test.each([409, 422] as const)("previene doble envío y reutiliza Idempotency-Key tras un %s sin perder el borrador", async (status) => {
  state.data.submit = vi.fn().mockResolvedValue(false);
  const view = render(<CustomerAssignmentPage />);
  configureAndContinue();
  fireEvent.click(screen.getByRole("button", { name: "Agregar Cliente 1 a la asignación" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar clientes" }), { target: { value: "Cliente" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuar a revisión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar operación" }));
  const dialog = screen.getByRole("alertdialog", { name: "Aplicar la asignación" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar asignación" }));
  fireEvent.click(within(dialog).getByRole("button", { name: /Asignando/ }));
  await waitFor(() => expect(state.data.submit).toHaveBeenCalledTimes(1));
  state.data.error = { status, correlationId: null, fieldErrors: [] };
  view.rerender(<CustomerAssignmentPage />);
  expect(screen.getByRole("alert").textContent).toContain("Conservamos la configuración");
  expect((screen.getByRole("searchbox", { name: "Buscar clientes" }) as HTMLInputElement).value).toBe("Cliente");
  expect(screen.getByRole("button", { name: "Quitar Cliente 1 de la asignación" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continuar a revisión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar operación" }));
  fireEvent.click(within(screen.getByRole("alertdialog", { name: "Aplicar la asignación" })).getByRole("button", { name: "Confirmar asignación" }));
  await waitFor(() => expect(state.data.submit).toHaveBeenCalledTimes(2));
  expect(state.data.submit.mock.calls[0]?.[1]).toBe(state.data.submit.mock.calls[1]?.[1]);
});

test("genera otra Idempotency-Key cuando cambia la intención de la operación", async () => {
  vi.mocked(crypto.randomUUID)
    .mockReturnValueOnce("11111111-1111-4111-8111-111111111111")
    .mockReturnValueOnce("22222222-2222-4222-8222-222222222222");
  state.data.submit = vi.fn().mockResolvedValue(false);
  render(<CustomerAssignmentPage />);
  configureAndContinue();
  fireEvent.click(screen.getByRole("button", { name: "Agregar Cliente 1 a la asignación" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar a revisión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar operación" }));
  fireEvent.click(within(screen.getByRole("alertdialog", { name: "Aplicar la asignación" })).getByRole("button", { name: "Confirmar asignación" }));
  await waitFor(() => expect(state.data.submit).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "Quitar Cliente 1 de la asignación" }));
  fireEvent.click(screen.getByRole("button", { name: "Agregar Cliente 2 a la asignación" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar a revisión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar operación" }));
  fireEvent.click(within(screen.getByRole("alertdialog", { name: "Aplicar la asignación" })).getByRole("button", { name: "Confirmar asignación" }));
  await waitFor(() => expect(state.data.submit).toHaveBeenCalledTimes(2));
  expect(state.data.submit.mock.calls[0]?.[1]).not.toBe(state.data.submit.mock.calls[1]?.[1]);
});

test("muestra resultado parcial sin éxito falso y limpia solo al cerrar", () => {
  state.data.results = [{ customerId: "client-1", status: "ASSIGNED", errorCode: null }, { customerId: "client-2", status: "REJECTED", errorCode: "CUSTOMER_INACTIVE" }];
  render(<CustomerAssignmentPage />);
  expect(screen.getByRole("dialog", { name: "Asignación completada con rechazos" })).toBeTruthy();
  expect(screen.getByText("Asignados: 1")).toBeTruthy();
  expect(screen.getByText("Rechazados: 1")).toBeTruthy();
  expect(screen.getByText("El cliente ya no está activo.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar y volver al listado" }));
  expect(state.data.clearResults).toHaveBeenCalledOnce();
});

test("conserva búsqueda y zona después de consultar el resultado", () => {
  const view = render(<CustomerAssignmentPage />);
  configureAndContinue();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar clientes" }), { target: { value: "Cliente" } });
  fireEvent.click(screen.getByRole("button", { name: "Filtrar por zona" }));
  fireEvent.click(screen.getByRole("option", { name: "Lima Centro" }));
  state.data.results = [{ customerId: "client-1", status: "ASSIGNED", errorCode: null }];
  view.rerender(<CustomerAssignmentPage />);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar y volver al listado" }));
  configureAndContinue();
  expect((screen.getByRole("searchbox", { name: "Buscar clientes" }) as HTMLInputElement).value).toBe("Cliente");
  expect(screen.getByRole("button", { name: "Filtrar por zona" }).textContent).toContain("Lima Centro");
});

test.each([
  ["ASSIGNED", null, "Asignación completada"],
  ["REJECTED", "CONFLICT", "No se asignó ningún cliente"],
] as const)("presenta el resultado %s con un título inequívoco", (resultStatus, errorCode, title) => {
  state.data.results = [{ customerId: "client-1", status: resultStatus, errorCode }];
  render(<CustomerAssignmentPage />);
  expect(screen.getByRole("dialog", { name: title })).toBeTruthy();
});

test.each([
  [400, "La solicitud no pudo validarse"],
  [403, "No tienes permisos"],
  [404, "Uno de los recursos ya no existe"],
  [409, "La información cambió"],
  [422, "Revisa la asignación"],
  [500, "No pudimos completar la operación"],
] as const)("muestra el estado de error %s", (status, title) => {
  state.data.error = { status, correlationId: null, fieldErrors: [] };
  render(<CustomerAssignmentPage />);
  expect(screen.getByText(title)).toBeTruthy();
});

test("limpia el estado sensible cuando cambia la sesión o empresa", () => {
  render(<CustomerAssignmentPage />);
  configureAndContinue();
  fireEvent.click(screen.getByRole("button", { name: "Agregar Cliente 1 a la asignación" }));
  state.identity = { id: "admin-2", company: { id: "tenant-2" }, roles: ["COMPANY_ADMIN"] };
  act(() => state.listener?.());
  expect(screen.getByRole("heading", { name: "1. Nuevos responsables y vigencia" })).toBeTruthy();
  expect(screen.getByText("0 seleccionados")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Nuevos responsables" }).textContent).toContain("Selecciona nuevos responsables");
});

function configure() {
  fireEvent.click(screen.getByRole("button", { name: "Nuevos responsables" }));
  fireEvent.click(screen.getByRole("option", { name: "Lucía Calderón" }));
  fireEvent.keyDown(screen.getByRole("listbox", { name: "Nuevos responsables" }), { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Vigente desde" }));
  fireEvent.click(document.querySelector<HTMLButtonElement>('.date-filter__days button[aria-current="date"]')!);
}

function configureAndContinue() {
  configure();
  fireEvent.click(screen.getByRole("button", { name: "Continuar a clientes" }));
}
