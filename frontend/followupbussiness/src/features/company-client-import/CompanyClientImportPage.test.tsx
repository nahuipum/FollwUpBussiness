import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CompanyClientImportPage } from "./CompanyClientImportPage";

const state = vi.hoisted(() => ({ hook: vi.fn(), navigate: vi.fn() }));
vi.mock("./hooks/useCustomerImport", () => ({ useCustomerImport: state.hook }));
vi.mock("../../app/navigation", () => ({ navigate: state.navigate }));

const file = new File(["x"], "clientes.csv", { type: "text/csv" });
const base = {
  file: null as File | null,
  templateVersion: "1.0" as string | null,
  partialAcceptance: true,
  job: null,
  loadingTemplate: false,
  checkingTemplateVersion: false,
  submitting: false,
  error: null,
  fileError: null,
  templateFailure: null,
  templateDownloaded: false,
  fileRemoved: false,
  forbidden: false,
  selectFile: vi.fn(),
  setPartialAcceptance: vi.fn(),
  downloadTemplate: vi.fn(),
  refreshTemplateVersion: vi.fn(),
  submit: vi.fn(),
  dismissError: vi.fn(),
};

beforeEach(() => {
  state.navigate.mockReset();
  Object.values(base).forEach((value) => { if (typeof value === "function" && "mockReset" in value) value.mockReset(); });
  state.hook.mockReset().mockReturnValue({ ...base });
});
afterEach(cleanup);

test("representa el encabezado y los cuatro pasos golden", () => {
  render(<CompanyClientImportPage />);
  expect(screen.getByText("Importación de clientes")).toBeTruthy();
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(screen.getByRole("heading", { name: "Carga de clientes" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Inicia la importación" })).toBeTruthy();
});

test("muestra la comprobación inicial y deshabilita el CTA", () => {
  state.hook.mockReturnValue({ ...base, checkingTemplateVersion: true, templateVersion: null });
  render(<CompanyClientImportPage />);
  expect(screen.getByRole("status").textContent).toContain("Comprobando la versión vigente");
  expect((screen.getByRole("button", { name: "Iniciar importación" }) as HTMLButtonElement).disabled).toBe(true);
});

test("la recuperación de versión ejecuta una consulta real", () => {
  state.hook.mockReturnValue({ ...base, templateVersion: null, templateFailure: { operation: "check", status: 500, correlationId: null } });
  render(<CompanyClientImportPage />);
  fireEvent.click(screen.getByRole("button", { name: "Volver a comprobar" }));
  expect(base.refreshTemplateVersion).toHaveBeenCalledOnce();
});

test("la recuperación de descarga vuelve a descargar", () => {
  state.hook.mockReturnValue({ ...base, templateFailure: { operation: "download", status: 500, correlationId: null } });
  render(<CompanyClientImportPage />);
  fireEvent.click(screen.getByRole("button", { name: "Intentar la descarga" }));
  expect(base.downloadTemplate).toHaveBeenCalledOnce();
});

test("el formato de plantilla no disponible vuelve a comprobar la versión", () => {
  state.hook.mockReturnValue({
    ...base,
    templateVersion: null,
    templateFailure: { operation: "download", status: 406, correlationId: null },
  });
  render(<CompanyClientImportPage />);
  expect(screen.getByRole("alert").textContent).toContain(
    "Formato de plantilla no disponible",
  );
  fireEvent.click(screen.getByRole("button", { name: "Volver a comprobar" }));
  expect(base.refreshTemplateVersion).toHaveBeenCalledOnce();
  expect(base.downloadTemplate).not.toHaveBeenCalled();
});

test("habilita CTA con archivo y versión, y envía aceptación parcial", () => {
  state.hook.mockReturnValue({ ...base, file, partialAcceptance: false });
  render(<CompanyClientImportPage />);
  const checkbox = screen.getByRole("checkbox", { name: /Importar las filas válidas/ });
  expect((checkbox as HTMLInputElement).checked).toBe(false);
  fireEvent.click(checkbox);
  expect(base.setPartialAcceptance).toHaveBeenCalledWith(true);
  const submit = screen.getByRole("button", { name: "Iniciar importación" });
  expect((submit as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(submit);
  expect(base.submit).toHaveBeenCalledOnce();
});

test("deshabilita todos los controles y anuncia el envío", () => {
  state.hook.mockReturnValue({ ...base, file, submitting: true });
  render(<CompanyClientImportPage />);
  expect((screen.getByRole("button", { name: "Enviando…" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: /Quitar archivo seleccionado/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/Enviando el archivo/).textContent).toContain("Enviando el archivo");
});

test.each([
  [400, "No pudimos procesar el archivo. Descarga una plantilla nueva e inténtalo otra vez."],
  [409, "Ya existe una importación equivalente. No se reenvió el archivo."],
  [413, "El archivo supera el límite de 10 MiB."],
  [415, "Selecciona un archivo CSV UTF-8 o XLSX sin macros."],
  [422, "El archivo no cumple los requisitos de la plantilla."],
  [500, "No pudimos completar la operación. Inténtalo nuevamente."],
])("muestra el mensaje aprobado para %s", (status, message) => {
  state.hook.mockReturnValue({ ...base, file, error: { status, correlationId: "123e4567-e89b-42d3-a456-426614174000" } });
  render(<CompanyClientImportPage />);
  expect(screen.getByRole("alert").textContent).toContain(message);
  expect(screen.getByText(/Correlation ID:/)).toBeTruthy();
});

test("representa el error local junto al selector", () => {
  state.hook.mockReturnValue({ ...base, fileError: { status: 413, code: "TOO_LARGE" } });
  render(<CompanyClientImportPage />);
  expect(screen.getByRole("alert").textContent).toContain("El archivo supera el límite de 10 MiB. Selecciona un archivo más pequeño.");
});

test("redirige con replace tras 202 sin representar FE-013", () => {
  state.hook.mockReturnValue({ ...base, job: { id: "00000000-0000-4000-8000-000000000001" } });
  render(<CompanyClientImportPage />);
  expect(state.navigate).toHaveBeenCalledWith("/company/customer-imports/00000000-0000-4000-8000-000000000001", { replace: true });
  expect(screen.queryByText("Filas recibidas")).toBeNull();
});

test("limita el estado forbidden a una superficie sin controles de carga", () => {
  state.hook.mockReturnValue({ ...base, forbidden: true, file: null, templateVersion: null });
  render(<CompanyClientImportPage />);
  expect(screen.getByRole("heading", { name: "No tienes permisos" })).toBeTruthy();
  expect(screen.queryByLabelText("Elige un archivo para importar")).toBeNull();
});
