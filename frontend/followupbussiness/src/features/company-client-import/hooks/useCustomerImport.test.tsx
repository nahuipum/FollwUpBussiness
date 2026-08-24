import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useCustomerImport } from "./useCustomerImport";

const state = vi.hoisted(() => ({ create: vi.fn(), download: vi.fn(), get: vi.fn(), listeners: new Set<() => void>(), generation: 1 }));
vi.mock("../api", () => ({ createCustomerImport: state.create, downloadCustomerImportTemplate: state.download, getCustomerImport: state.get }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => state.generation, getSessionIdentity: () => ({ id: "admin", company: { id: "company-a" }, roles: ["COMPANY_ADMIN"] }), subscribeToSession: (listener: () => void) => { state.listeners.add(listener); return () => state.listeners.delete(listener); } }));

const job = { id: "00000000-0000-4000-8000-000000000001", status: "PENDING", totalRows: 1, acceptedRows: 0, rejectedRows: 0, createdAt: "2026-08-24T10:00:00Z", completedAt: null };
beforeEach(() => { state.create.mockReset(); state.download.mockReset(); state.get.mockReset(); state.generation = 1; vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:template"); vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined); vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

test("bloquea extensiones y tamaños no permitidos sin enviar el archivo", () => {
  const { result } = renderHook(useCustomerImport);
  act(() => result.current.selectFile(new File([new Uint8Array(1)], "clientes.exe", { type: "application/octet-stream" })));
  expect(result.current.file).toBeNull();
  expect(result.current.error?.status).toBe(415);
});

test("envía un único intento y consulta el trabajo de forma controlada", async () => {
  vi.useFakeTimers(); state.create.mockResolvedValue({ response: new Response(JSON.stringify(job), { status: 202 }), job, correlationId: null }); state.get.mockResolvedValue({ response: new Response(JSON.stringify({ ...job, status: "COMPLETED", acceptedRows: 1 }), { status: 200 }), job: { ...job, status: "COMPLETED", acceptedRows: 1 }, correlationId: null });
  const { result } = renderHook(useCustomerImport);
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  state.download.mockResolvedValue({ response: new Response("x", { status: 200, headers: { "X-Template-Version": "1.0" } }), blob: new Blob(["x"]), templateVersion: "1.0", correlationId: null });
  await act(async () => { await result.current.downloadTemplate(); });
  await act(async () => { await result.current.submit(); });
  await act(async () => { await result.current.submit(); });
  expect(state.create).toHaveBeenCalledOnce();
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(state.get).toHaveBeenCalledWith(job.id);
  expect(result.current.job?.status).toBe("COMPLETED");
});

test("limpia archivo, versión y trabajo cuando cambia la sesión", async () => {
  const { result } = renderHook(useCustomerImport);
  state.download.mockResolvedValue({ response: new Response("x", { status: 200, headers: { "X-Template-Version": "1.0" } }), blob: new Blob(["x"]), templateVersion: "1.0", correlationId: null });
  await act(async () => { await result.current.downloadTemplate(); });
  act(() => result.current.selectFile(new File(["x"], "clientes.csv", { type: "text/csv" })));
  state.generation = 2;
  act(() => state.listeners.forEach((listener) => listener()));
  expect(result.current.file).toBeNull();
  expect(result.current.templateVersion).toBeNull();
});
