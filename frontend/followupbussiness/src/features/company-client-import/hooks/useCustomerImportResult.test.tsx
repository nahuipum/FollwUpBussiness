import { StrictMode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useCustomerImportResult } from "./useCustomerImportResult";

const state = vi.hoisted(() => ({ get: vi.fn(), download: vi.fn(), listeners: new Set<() => void>(), generation: 1 }));
vi.mock("../api", () => ({ getCustomerImport: state.get, downloadCustomerImportErrors: state.download }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => state.generation, getSessionIdentity: () => ({ id: "admin", company: { id: "company-a" }, roles: ["COMPANY_ADMIN"] }), subscribeToSession: (listener: () => void) => { state.listeners.add(listener); return () => state.listeners.delete(listener); } }));

const job = { id: "00000000-0000-4000-8000-000000000001", status: "COMPLETED_WITH_ERRORS", totalRows: 3, acceptedRows: 2, rejectedRows: 1, createdAt: "2026-08-24T10:00:00Z", completedAt: "2026-08-24T10:01:00Z", errorFileExpiresAt: "2026-08-25T10:00:00Z" };

beforeEach(() => { state.get.mockReset(); state.download.mockReset(); state.generation = 1; vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:errors"); vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined); vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

test("detiene el polling al recibir un estado terminal", async () => {
  vi.useFakeTimers();
  state.get.mockResolvedValue({ response: new Response(JSON.stringify(job), { status: 200 }), job, correlationId: null });
  const { result } = renderHook(() => useCustomerImportResult(job.id));
  await act(async () => {});
  expect(result.current.job?.status).toBe("COMPLETED_WITH_ERRORS");
  await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
  expect(state.get).toHaveBeenCalledOnce();
});

test("explica 410 y deshabilita una nueva descarga", async () => {
  state.get.mockResolvedValue({ response: new Response(JSON.stringify(job), { status: 200 }), job, correlationId: null });
  state.download.mockResolvedValue({ response: new Response(null, { status: 410 }), blob: null, correlationId: null });
  const { result } = renderHook(() => useCustomerImportResult(job.id));
  await act(async () => {});
  await act(async () => { await result.current.downloadErrors(); });
  expect(result.current.expired).toBe(true);
  await act(async () => { await result.current.downloadErrors(); });
  expect(state.download).toHaveBeenCalledOnce();
});

test("borra el resultado cuando cambia la empresa o sesión", async () => {
  state.get.mockResolvedValue({ response: new Response(JSON.stringify(job), { status: 200 }), job, correlationId: null });
  const { result } = renderHook(() => useCustomerImportResult(job.id));
  await act(async () => {});
  state.generation = 2;
  act(() => state.listeners.forEach((listener) => listener()));
  expect(result.current.job).toBeNull();
});

test("no conserva contadores cuando el resultado deja de estar autorizado", async () => {
  state.get.mockResolvedValueOnce({ response: new Response(JSON.stringify({ ...job, status: "PROCESSING" }), { status: 200 }), job: { ...job, status: "PROCESSING" }, correlationId: null }).mockResolvedValueOnce({ response: new Response(null, { status: 403 }), job: null, correlationId: null });
  const { result } = renderHook(() => useCustomerImportResult(job.id));
  await act(async () => {});
  await act(async () => { await result.current.refresh(); });
  expect(result.current.forbidden).toBe(true);
  expect(result.current.job).toBeNull();
});

test("conserva el estado 404 neutral para que la página muestre una recuperación", async () => {
  state.get.mockResolvedValue({ response: new Response(null, { status: 404 }), job: null, correlationId: "corr-404" });
  const { result } = renderHook(() => useCustomerImportResult(job.id));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.job).toBeNull();
  expect(result.current.forbidden).toBe(false);
  expect(result.current.error).toEqual({ status: 404, correlationId: "corr-404" });
});

test("deja de cargar y permite reintentar cuando la consulta excede el límite", async () => {
  vi.useFakeTimers();
  state.get.mockImplementation((_id: string, signal?: AbortSignal) => new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("Abortado", "AbortError")))));
  const { result } = renderHook(() => useCustomerImportResult(job.id));
  await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
  expect(result.current.loading).toBe(false);
  expect(result.current.error?.status).toBe(500);
});

test("reinicia la consulta tras la comprobación de efectos de desarrollo", async () => {
  let calls = 0;
  state.get.mockImplementation((_id: string, signal?: AbortSignal) => {
    calls += 1;
    if (calls === 1) return new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("Abortado", "AbortError"))));
    return Promise.resolve({ response: new Response(JSON.stringify(job), { status: 200 }), job, correlationId: null });
  });
  const { result } = renderHook(() => useCustomerImportResult(job.id), { wrapper: StrictMode });
  await waitFor(() => expect(result.current.job?.status).toBe("COMPLETED_WITH_ERRORS"));
  expect(state.get).toHaveBeenCalledTimes(2);
});
