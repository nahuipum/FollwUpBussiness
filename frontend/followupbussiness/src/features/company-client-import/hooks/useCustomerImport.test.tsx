import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCustomerImport } from "./useCustomerImport";

const state = vi.hoisted(() => ({
  create: vi.fn(),
  download: vi.fn(),
  version: vi.fn(),
  listeners: new Set<() => void>(),
  generation: 1,
  role: "COMPANY_ADMIN",
}));
vi.mock("../api", () => ({ createCustomerImport: state.create, downloadCustomerImportTemplate: state.download, getCustomerImportTemplateVersion: state.version }));
vi.mock("../../auth/auth", () => ({
  getSessionGeneration: () => state.generation,
  getSessionIdentity: () => ({ id: "admin", company: { id: "company-a" }, roles: [state.role] }),
  subscribeToSession: (listener: () => void) => {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  },
}));

const xlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const maximumFileBytes = 10 * 1024 * 1024;
const job = { id: "00000000-0000-4000-8000-000000000001", status: "PENDING", totalRows: 1, acceptedRows: 0, rejectedRows: 0, createdAt: "2026-08-24T10:00:00Z", completedAt: null, errorFileExpiresAt: null, failureReason: null };
const versionResult = (value = "1.0", status = 200) => ({ response: new Response(null, { status, headers: { "X-Template-Version": value } }), templateVersion: status === 200 ? value : null, correlationId: null });

beforeEach(() => {
  state.create.mockReset();
  state.download.mockReset();
  state.version.mockReset().mockResolvedValue(versionResult());
  state.generation = 1;
  state.role = "COMPANY_ADMIN";
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:template");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("comprueba automáticamente la versión vigente", async () => {
  const { result } = renderHook(useCustomerImport);
  expect(result.current.checkingTemplateVersion).toBe(true);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  expect(state.version).toHaveBeenCalledOnce();
});

test("reintenta realmente una comprobación fallida", async () => {
  state.version.mockResolvedValueOnce(versionResult("", 500)).mockResolvedValueOnce(versionResult("2.0"));
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateFailure?.operation).toBe("check"));
  await act(async () => { await result.current.refreshTemplateVersion(); });
  expect(state.version).toHaveBeenCalledTimes(2);
  expect(result.current.templateVersion).toBe("2.0");
  expect(result.current.templateFailure).toBeNull();
});

test("descarga una sola vez, conserva formato y revoca el Object URL", async () => {
  let resolveDownload!: (value: unknown) => void;
  let downloadName = "";
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloadName = this.download;
  });
  state.download.mockReturnValue(new Promise((resolve) => { resolveDownload = resolve; }));
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  await act(async () => {
    const first = result.current.downloadTemplate();
    const duplicate = result.current.downloadTemplate();
    resolveDownload({ response: new Response("x", { status: 200, headers: { "X-Template-Version": "2.0", "Content-Type": xlsxType } }), blob: new Blob(["x"], { type: xlsxType }), templateVersion: "2.0", correlationId: null });
    await Promise.all([first, duplicate]);
  });
  expect(state.download).toHaveBeenCalledOnce();
  expect(result.current.templateVersion).toBe("2.0");
  expect(result.current.templateDownloaded).toBe(true);
  expect(downloadName).toBe("plantilla-clientes.xlsx");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:template");
});

describe("validación local sin leer contenido", () => {
  test.each([
    ["clientes.csv", "text/csv"],
    ["clientes.xlsx", xlsxType],
    ["clientes.csv", ""],
    ["clientes.xlsx", ""],
  ])("acepta %s con MIME %s", async (name, type) => {
    const { result } = renderHook(useCustomerImport);
    const file = new File(["x"], name, { type });
    act(() => result.current.selectFile(file));
    expect(result.current.file).toBe(file);
    expect(result.current.fileError).toBeNull();
  });

  test.each([
    [new File(["x"], "clientes.exe", { type: "application/octet-stream" }), "INVALID_EXTENSION"],
    [new File(["x"], "clientes.csv", { type: "application/pdf" }), "INVALID_MIME"],
    [new File(["x"], "clientes.xlsx", { type: "text/csv" }), "INVALID_MIME"],
    [new File(["x"], "clientes.xlsm", { type: xlsxType }), "MACROS_NOT_ALLOWED"],
  ])("rechaza $code", async (file, code) => {
    const { result } = renderHook(useCustomerImport);
    act(() => result.current.selectFile(file));
    expect(result.current.file).toBeNull();
    expect(result.current.fileError?.code).toBe(code);
    expect(result.current.fileError?.status).toBe(415);
  });

  test("distingue tamaño excedido como 413 y acepta exactamente 10 MiB", () => {
    const { result } = renderHook(useCustomerImport);
    const exact = new File([new Uint8Array(maximumFileBytes)], "clientes.csv", { type: "text/csv" });
    act(() => result.current.selectFile(exact));
    expect(result.current.file).toBe(exact);
    const oversized = new File([new Uint8Array(maximumFileBytes + 1)], "clientes.csv", { type: "text/csv" });
    act(() => result.current.selectFile(oversized));
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toEqual({ status: 413, code: "TOO_LARGE" });
  });
});

test("envía aceptación parcial true y false con una idempotencia por intento", async () => {
  state.create.mockResolvedValue({ response: new Response(null, { status: 500 }), job: null, correlationId: null });
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  await act(async () => { await result.current.submit(); });
  const firstKey = state.create.mock.calls[0]?.[0].idempotencyKey;
  expect(state.create.mock.calls[0]?.[0]).toMatchObject({ partialAcceptance: true });
  act(() => result.current.setPartialAcceptance(false));
  await act(async () => { await result.current.submit(); });
  expect(state.create.mock.calls[1]?.[0]).toMatchObject({ partialAcceptance: false });
  expect(state.create.mock.calls[1]?.[0].idempotencyKey).not.toBe(firstKey);
});

test("mantiene la misma idempotencia al reintentar un fallo de red", async () => {
  state.create.mockRejectedValueOnce(new TypeError("network")).mockResolvedValueOnce({ response: new Response(null, { status: 500 }), job: null, correlationId: null });
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  await act(async () => { await result.current.submit(); await result.current.submit(); });
  expect(state.create.mock.calls[0]?.[0].idempotencyKey).toBe(state.create.mock.calls[1]?.[0].idempotencyKey);
});

test("bloquea doble POST y limpia el archivo tras 202", async () => {
  let resolveCreate!: (value: unknown) => void;
  state.create.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  await act(async () => {
    const first = result.current.submit();
    const duplicate = result.current.submit();
    resolveCreate({ response: new Response(JSON.stringify(job), { status: 202 }), job, correlationId: null });
    await Promise.all([first, duplicate]);
  });
  expect(state.create).toHaveBeenCalledOnce();
  expect(result.current.job?.id).toBe(job.id);
  expect(result.current.file).toBeNull();
});

test.each([400, 409, 413, 415, 422, 500])("conserva el error %s y su correlationId sin reenvío automático", async (status) => {
  state.create.mockResolvedValue({ response: new Response(null, { status }), job: null, correlationId: "123e4567-e89b-42d3-a456-426614174000" });
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  await act(async () => { await result.current.submit(); });
  expect(result.current.error).toEqual({ status, correlationId: "123e4567-e89b-42d3-a456-426614174000" });
  expect(state.create).toHaveBeenCalledOnce();
});

test("limpia archivo, versión, trabajo e idempotencia ante 403", async () => {
  state.create.mockResolvedValue({ response: new Response(null, { status: 403 }), job: null, correlationId: null });
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  await act(async () => { await result.current.submit(); });
  expect(result.current.forbidden).toBe(true);
  expect(result.current.file).toBeNull();
  expect(result.current.templateVersion).toBeNull();
  expect(result.current.job).toBeNull();
});

test("limpia el flujo y descarta la consulta obsoleta al cambiar de sesión o empresa", async () => {
  let resolveOld!: (value: unknown) => void;
  state.version.mockReset().mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValueOnce(versionResult("2.0"));
  const { result } = renderHook(useCustomerImport);
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  state.generation = 2;
  act(() => state.listeners.forEach((listener) => listener()));
  await waitFor(() => expect(result.current.templateVersion).toBe("2.0"));
  await act(async () => { resolveOld(versionResult("obsolete")); await Promise.resolve(); });
  expect(result.current.templateVersion).toBe("2.0");
  expect(result.current.file).toBeNull();
});

test("limpia el flujo sin consultar la plantilla al cambiar a SUPERVISOR", async () => {
  const { result } = renderHook(useCustomerImport);
  await waitFor(() => expect(result.current.templateVersion).toBe("1.0"));
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));

  state.role = "SUPERVISOR";
  state.generation = 2;
  act(() => state.listeners.forEach((listener) => listener()));

  expect(result.current.forbidden).toBe(true);
  expect(result.current.file).toBeNull();
  expect(result.current.templateVersion).toBeNull();
  expect(state.version).toHaveBeenCalledOnce();
});
