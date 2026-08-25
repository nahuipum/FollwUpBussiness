import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCompanySettings } from "./useCompanySettings";

const state = vi.hoisted(() => ({ generation: 1, listener: null as (() => void) | null, get: vi.fn() }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => state.generation, subscribeToSession: (listener: () => void) => { state.listener = listener; return () => { state.listener = null; }; } }));
vi.mock("../api", () => ({ getCompanySettings: state.get, updateCompanySettings: vi.fn() }));
const snapshot = (etag: string) => ({ settings: { timezone: "America/Lima", currency: "PEN", geofenceRadiusMeters: 100 as const, trackingIntervalSeconds: 60 as const, locationRetentionDays: 90 as const, saleEditWindowMinutes: 30 }, etag });
afterEach(() => { state.generation = 1; state.listener = null; state.get.mockReset(); });
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
