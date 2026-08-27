import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRouteDirections } from "./useRouteDirections";

const state = vi.hoisted(() => ({ get: vi.fn(), preview: vi.fn(), sessionListener: undefined as (() => void) | undefined }));
vi.mock("../../../lib/api", () => ({ ApiRequestObsoleteError: class extends Error {}, normalizeApiError: async (response: Response) => ({ status: response.status, correlationId: null, fieldErrors: [] }) }));
vi.mock("../../auth/auth", () => ({ subscribeToSession: (listener: () => void) => { state.sessionListener = listener; return () => { if (state.sessionListener === listener) state.sessionListener = undefined; }; } }));
vi.mock("../api", () => ({ getRouteDirections: state.get, previewRouteDirections: state.preview }));

const route = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", sequence: 1, customerName: "Norte" }, { routePointId: "opaque-2", sequence: 2, customerName: "Sur" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };

beforeEach(() => { state.get.mockReset(); state.preview.mockReset(); state.sessionListener = undefined; });

test("previsualiza el detalle vial para el orden local sin esperar a guardarlo", async () => {
  state.get.mockResolvedValue({ response: new Response("", { status: 200 }), directions: { geometry: [{ latitude: -12.04, longitude: -77.03 }, { latitude: -12.05, longitude: -77.04 }], legs: [], distanceMeters: 1200, durationSeconds: 300 } });
  const { result, rerender } = renderHook(({ value }) => useRouteDirections(value), { initialProps: { value: route } });
  await waitFor(() => expect(result.current.directions?.geometry).toHaveLength(2));
  expect(state.get).toHaveBeenCalledWith("route-1", expect.any(AbortSignal));
  state.preview.mockResolvedValue({ response: new Response("", { status: 200 }), directions: { geometry: [{ latitude: -12.05, longitude: -77.04 }, { latitude: -12.04, longitude: -77.03 }], legs: [], distanceMeters: 1250, durationSeconds: 310 } });
  rerender({ value: { ...route, points: [...route.points].reverse().map((point, index) => ({ ...point, sequence: index + 1 })) } });
  await waitFor(() => expect(state.preview).toHaveBeenCalledWith("route-1", 1, ["opaque-2", "opaque-1"], expect.any(AbortSignal)));
  await waitFor(() => expect(result.current.stale).toBe(false));
  expect(state.get).toHaveBeenCalledTimes(1);
  await act(async () => rerender({ value: { ...route, version: 2, points: [...route.points].reverse().map((point, index) => ({ ...point, sequence: index + 1 })) } }));
  await waitFor(() => expect(state.get).toHaveBeenCalledTimes(2));
});

test("descarta Directions pendiente tras logout o cambio de tenant", async () => {
  let resolve: ((value: { response: Response; directions: { geometry: readonly { latitude: number; longitude: number }[]; legs: readonly []; distanceMeters: number; durationSeconds: number } }) => void) | undefined;
  state.get.mockImplementation(() => new Promise((next) => { resolve = next; }));
  const { result } = renderHook(() => useRouteDirections(route));
  await waitFor(() => expect(state.get).toHaveBeenCalledWith("route-1", expect.any(AbortSignal)));
  act(() => state.sessionListener?.());
  await act(async () => { resolve?.({ response: new Response("", { status: 200 }), directions: { geometry: [{ latitude: -12.04, longitude: -77.03 }, { latitude: -12.05, longitude: -77.04 }], legs: [], distanceMeters: 1200, durationSeconds: 300 } }); });
  expect(result.current.directions).toBeNull();
  expect(result.current.loading).toBe(false);
});
