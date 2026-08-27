import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRouteDraft } from "./useRouteDraft";

const state = vi.hoisted(() => ({ portfolio: vi.fn(), suggestions: vi.fn(), create: vi.fn(), reorder: vi.fn(), get: vi.fn() }));
vi.mock("../../../lib/api", () => ({ ApiRequestObsoleteError: class extends Error {}, normalizeApiError: async (response: Response) => ({ status: response.status, correlationId: null, fieldErrors: [] }) }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => 1, getSessionIdentity: () => ({ id: "admin", company: { id: "company" } }), subscribeToSession: () => () => undefined }));
vi.mock("../api", () => ({ createRoute: state.create, getRoute: state.get, reorderRoutePoints: state.reorder, listRouteCustomers: state.portfolio, listSuggestedRouteCustomers: state.suggestions }));

beforeEach(() => { state.portfolio.mockReset(); state.suggestions.mockReset(); state.create.mockReset(); state.reorder.mockReset(); state.get.mockReset(); });
test("mantiene la cartera seleccionable y ofrece reintento cuando fallan solo las sugerencias", async () => {
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-1", label: "Comercial Norte", suggested: false }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } } });
  state.suggestions.mockResolvedValue({ response: new Response("", { status: 500 }), page: null });
  const { result } = renderHook(() => useRouteDraft(vi.fn()));
  act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); });
  await waitFor(() => expect(result.current.customers).toEqual([{ id: "customer-1", label: "Comercial Norte", suggested: false }]));
  expect(result.current.suggestionError?.status).toBe(500); expect(result.current.error).toBeNull();
});
test("reutiliza la misma clave tras una pérdida de respuesta y la invalida al cambiar clientes", async () => {
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-1", label: "Comercial Norte", suggested: false }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } } }); state.suggestions.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 0 } } });
  state.create.mockRejectedValueOnce(new Error("network lost")).mockRejectedValueOnce(new Error("network lost"));
  const { result } = renderHook(() => useRouteDraft(vi.fn())); act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); }); await waitFor(() => expect(result.current.customers).toHaveLength(1)); act(() => result.current.setSelected(["customer-1"])); await act(async () => { await result.current.submit(); await result.current.submit(); });
  const firstKey = state.create.mock.calls[0]?.[1]; expect(state.create).toHaveBeenCalledTimes(2); expect(state.create.mock.calls[1]?.[1]).toBe(firstKey);
  act(() => result.current.setSelected(["customer-2"])); await act(async () => { await result.current.submit(); }); expect(state.create.mock.calls[2]?.[1]).not.toBe(firstKey); expect(state.create.mock.calls[2]?.[0].customerIds).toEqual(["customer-2"]);
});
test("reordena por destino de arrastre y persiste la permutación actual", async () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", sequence: 1, customerName: "Norte" }, { routePointId: "opaque-2", sequence: 2, customerName: "Sur" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-1", label: "Comercial Norte", suggested: false }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } } }); state.suggestions.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 0 } } }); state.create.mockResolvedValue({ response: new Response("", { status: 201 }), route: draft }); state.reorder.mockResolvedValue({ response: new Response("", { status: 200 }), route: { ...draft, points: [...draft.points].reverse().map((point, index) => ({ ...point, sequence: index + 1 })) } });
  const { result } = renderHook(() => useRouteDraft(vi.fn())); act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); }); await waitFor(() => expect(result.current.customers).toHaveLength(1)); act(() => result.current.setSelected(["customer-1"])); await act(async () => { await result.current.submit(); });
  act(() => result.current.moveTo(0, 1)); expect(result.current.draft?.points.map((point) => point.customerName)).toEqual(["Sur", "Norte"]); expect(result.current.announcement).toContain("posición 2"); await act(async () => { await result.current.saveOrder(); }); expect(state.reorder).toHaveBeenCalledWith(expect.objectContaining({ id: "route-1", version: 1 }), expect.arrayContaining([expect.objectContaining({ routePointId: "opaque-2", sequence: 1 })]));
});
test("ante 409 conserva el orden local y actualiza la versión para reintentar", async () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", sequence: 1, customerName: "Norte" }, { routePointId: "opaque-2", sequence: 2, customerName: "Sur" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  const remote = { ...draft, version: 2 };
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-1", label: "Comercial Norte", suggested: false }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } } }); state.suggestions.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 0 } } }); state.create.mockResolvedValue({ response: new Response("", { status: 201 }), route: draft }); state.reorder.mockResolvedValue({ response: new Response("", { status: 409 }), route: null }); state.get.mockResolvedValue({ response: new Response("", { status: 200 }), route: remote });
  const { result } = renderHook(() => useRouteDraft(vi.fn())); act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); }); await waitFor(() => expect(result.current.customers).toHaveLength(1)); act(() => result.current.setSelected(["customer-1"])); await act(async () => { await result.current.submit(); }); act(() => result.current.moveTo(0, 1)); await act(async () => { await result.current.saveOrder(); });
  expect(state.get).toHaveBeenCalledWith("route-1"); expect(result.current.conflict).toBe(true); expect(result.current.draft).toMatchObject({ version: 2, points: [{ customerName: "Sur", sequence: 1 }, { customerName: "Norte", sequence: 2 }] });
});
