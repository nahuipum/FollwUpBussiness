import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRouteDraft } from "./useRouteDraft";

const state = vi.hoisted(() => ({ portfolio: vi.fn(), suggestions: vi.fn(), create: vi.fn(), optimize: vi.fn(), reorder: vi.fn(), get: vi.fn() }));
const seller = [{ id: "seller-1", label: "Ana", territoryIds: ["territory-1"] }] as const;
vi.mock("../../../lib/api", () => ({ ApiRequestObsoleteError: class extends Error {}, normalizeApiError: async (response: Response) => ({ status: response.status, correlationId: null, fieldErrors: [] }) }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => 1, getSessionIdentity: () => ({ id: "admin", company: { id: "company" } }), subscribeToSession: () => () => undefined }));
vi.mock("../api", () => ({ createRoute: state.create, getRoute: state.get, optimizeRoute: state.optimize, reorderRoutePoints: state.reorder, listRouteCustomers: state.portfolio, listSuggestedRouteCustomers: state.suggestions }));

beforeEach(() => { state.portfolio.mockReset(); state.suggestions.mockReset(); state.create.mockReset(); state.optimize.mockReset(); state.reorder.mockReset(); state.get.mockReset(); });
test("no ofrece clientes fuera de los territorios asignados al vendedor seleccionado", async () => {
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-in", label: "Dentro", territoryId: "territory-1", suggested: false }, { id: "customer-out", label: "Fuera", territoryId: "territory-2", suggested: false }, { id: "customer-without", label: "Sin territorio", territoryId: null, suggested: false }], page: { page: 0, pageSize: 100, totalElements: 3, totalPages: 1 } } });
  state.suggestions.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-suggested", label: "Sugerido dentro", territoryId: "territory-1", suggested: true }, { id: "customer-suggested-out", label: "Sugerido fuera", territoryId: "territory-2", suggested: true }], page: { page: 0, pageSize: 100, totalElements: 2, totalPages: 1 } } });
  const { result } = renderHook(() => useRouteDraft(vi.fn(), seller));
  act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); });
  await waitFor(() => expect(result.current.customers.map((customer) => customer.id)).toEqual(["customer-in", "customer-suggested"]));
});
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
test("aplica la propuesta sólo en memoria y envía proposalVersion al guardar el orden", async () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", customerId: "customer-1", sequence: 1, customerName: "Norte" }, { routePointId: "opaque-2", customerId: "customer-2", sequence: 2, customerName: "Sur" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-1", label: "Norte", suggested: false }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } } }); state.suggestions.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 0 } } }); state.create.mockResolvedValue({ response: new Response("", { status: 201 }), route: draft }); state.optimize.mockResolvedValue({ response: new Response("", { status: 200 }), proposal: { proposalVersion: 7, baseRouteVersion: 1, orderedVisits: [{ customerId: "customer-2", sequence: 1 }, { customerId: "customer-1", sequence: 2 }], unassignedVisits: [], optimality: "OPTIMAL" } }); state.reorder.mockResolvedValue({ response: new Response("", { status: 200 }), route: draft });
  const { result } = renderHook(() => useRouteDraft(vi.fn())); act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); }); await waitFor(() => expect(result.current.customers).toHaveLength(1)); act(() => result.current.setSelected(["customer-1"])); await act(async () => { await result.current.submit(); }); act(() => result.current.openProposal(draft)); expect(result.current.proposalVisits.every((visit) => !visit.included)).toBe(true); act(() => { result.current.setAvailabilityStart("08:00"); result.current.setAvailabilityEnd("17:00"); result.current.updateProposalVisit("customer-1", { included: true, serviceDurationMinutes: "30", priority: "3" }); }); await act(async () => { await result.current.optimize(); }); expect(state.optimize).toHaveBeenCalledWith(expect.objectContaining({ availability: { start: new Date("2026-08-26T08:00").toISOString(), end: new Date("2026-08-26T17:00").toISOString() }, visits: expect.arrayContaining([expect.objectContaining({ serviceDurationSeconds: 1800, priority: 3 })]) })); expect(state.optimize).toHaveBeenCalledWith(expect.not.objectContaining({ territoryId: expect.anything() })); expect(result.current.draft?.points.map((point) => point.customerName)).toEqual(["Sur", "Norte"]); await act(async () => { await result.current.saveOrder(); }); expect(state.reorder).toHaveBeenCalledWith(expect.objectContaining({ id: "route-1" }), expect.any(Array), 7);
});

test("abre el modal de propuesta desde Ordenar borrador sin superponer ambos diálogos", async () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", customerId: "customer-1", sequence: 1, customerName: "Norte" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  state.portfolio.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [{ id: "customer-1", label: "Norte", suggested: false }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } } });
  state.suggestions.mockResolvedValue({ response: new Response("", { status: 200 }), page: { items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 0 } } });
  state.create.mockResolvedValue({ response: new Response("", { status: 201 }), route: draft });
  const { result } = renderHook(() => useRouteDraft(vi.fn()));
  act(() => { result.current.openForm(); result.current.setDate("2026-08-26"); result.current.setSellerId("seller-1"); });
  await waitFor(() => expect(result.current.customers).toHaveLength(1));
  act(() => result.current.setSelected(["customer-1"]));
  await act(async () => { await result.current.submit(); });
  act(() => result.current.openProposalFromOrder());
  expect(result.current.orderOpen).toBe(false);
  expect(result.current.proposalOpen).toBe(true);
  act(() => result.current.closeProposal());
  expect(result.current.orderOpen).toBe(true);
});

test("bloquea inicio y fin de jornada iguales antes de solicitar la propuesta", async () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", customerId: "customer-1", sequence: 1, customerName: "Norte" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  const { result } = renderHook(() => useRouteDraft(vi.fn()));
  act(() => { result.current.openProposal(draft); result.current.setAvailabilityStart("08:00"); result.current.setAvailabilityEnd("08:00"); result.current.updateProposalVisit("customer-1", { included: true, serviceDurationMinutes: "30", priority: "3" }); });
  await act(async () => { await result.current.optimize(); });
  expect(state.optimize).not.toHaveBeenCalled();
  expect(result.current.proposalValidation.availability).toBe("El inicio de jornada debe ser anterior al fin.");
});

test("bloquea una ventana invertida antes de solicitar la propuesta", async () => {
  const draft = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", customerId: "customer-1", sequence: 1, customerName: "Norte" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
  const { result } = renderHook(() => useRouteDraft(vi.fn()));
  act(() => { result.current.openProposal(draft); result.current.setAvailabilityStart("08:00"); result.current.setAvailabilityEnd("17:00"); result.current.updateProposalVisit("customer-1", { included: true, serviceDurationMinutes: "30", priority: "3", windowStart: "12:00", windowEnd: "09:00" }); });
  await act(async () => { await result.current.optimize(); });
  expect(state.optimize).not.toHaveBeenCalled();
  expect(result.current.proposalValidation.windows["customer-1"]).toBe("El inicio de la ventana debe ser anterior al fin.");
});
