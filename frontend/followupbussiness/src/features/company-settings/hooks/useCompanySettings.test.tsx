import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCompanySettings } from "./useCompanySettings";

const state = vi.hoisted(() => ({ generation: 1, listener: null as (() => void) | null, get: vi.fn(), update: vi.fn() }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => state.generation, subscribeToSession: (listener: () => void) => { state.listener = listener; return () => { state.listener = null; }; } }));
vi.mock("../api", () => ({ getCompanySettings: state.get, updateCompanySettings: state.update }));
const snapshot = (etag: string) => ({ settings: { timezone: "America/Lima", currency: "PEN", geofenceRadiusMeters: 100 as const, trackingIntervalSeconds: 60 as const, locationRetentionDays: 90 as const, saleEditWindowMinutes: 30, planningDayStart: null, planningDayEnd: null }, etag });
afterEach(() => { state.generation = 1; state.listener = null; state.get.mockReset(); state.update.mockReset(); });
test("invalida el ETag anterior y consulta la configuración del nuevo tenant al cambiar sesión", async () => {
  let resolveNewTenant: (value: { response: Response; snapshot: ReturnType<typeof snapshot> }) => void = () => undefined;
  state.get.mockResolvedValueOnce({ response: new Response(null, { status: 200 }), snapshot: snapshot("\"7\"") }).mockReturnValueOnce(new Promise((resolve) => { resolveNewTenant = resolve; }));
  const { result } = renderHook(() => useCompanySettings());
  await waitFor(() => expect(result.current.snapshot?.etag).toBe("\"7\""));
  state.generation = 2;
  await act(async () => { state.listener?.(); });
  expect(result.current.loading).toBe(true);
  expect(result.current.snapshot).toBeNull();
  resolveNewTenant({ response: new Response(null, { status: 200 }), snapshot: snapshot("\"8\"") });
  await waitFor(() => expect(result.current.snapshot?.etag).toBe("\"8\""));
  expect(state.get).toHaveBeenCalledTimes(2);
});
test("un 403 de PATCH bloquea un segundo envío hasta recargar", async () => {
  state.get.mockResolvedValue({ response: new Response(null, { status: 200 }), snapshot: snapshot("\"7\"") });
  state.update.mockResolvedValue({ response: new Response(null, { status: 403 }), snapshot: null });
  const { result } = renderHook(() => useCompanySettings());
  await waitFor(() => expect(result.current.snapshot?.etag).toBe("\"7\""));
  await act(async () => { await result.current.save({ currency: "PEN", saleEditWindowMinutes: 31, planningDayStart: null, planningDayEnd: null }); });
  expect(result.current.error?.status).toBe(403);
  await act(async () => { await result.current.save({ currency: "PEN", saleEditWindowMinutes: 32, planningDayStart: null, planningDayEnd: null }); });
  expect(state.update).toHaveBeenCalledTimes(1);
});
test("un GET 403 posterior elimina la configuración confirmada", async () => {
  state.get.mockResolvedValueOnce({ response: new Response(null, { status: 200 }), snapshot: snapshot('"7"') })
    .mockResolvedValueOnce({ response: new Response(null, { status: 403 }), snapshot: null });
  const { result } = renderHook(() => useCompanySettings());
  await waitFor(() => expect(result.current.snapshot?.etag).toBe('"7"'));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.error?.status).toBe(403));
  expect(result.current.snapshot).toBeNull();
  expect(result.current.lastUpdated).toBeNull();
  expect(result.current.stale).toBe(false);
  expect(result.current.loading).toBe(false);
});
