import { beforeEach, expect, test, vi } from "vitest";
import { createRoute, getRoute, getRouteDirections, listRouteCustomers, listRouteSellerOptions, listRoutes, listSuggestedRouteCustomers, optimizeRoute, previewRouteDirections, publishRoute, reorderRoutePoints } from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({ getSessionAuthorization: () => ({ Authorization: "Bearer session" }), getSessionMutationAuthorization: () => ({ Authorization: "Bearer session", "X-CSRF-Token": "csrf" }) }));

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED", points: [{ id: "point-1", customerId: "customer-1", customerName: "Comercial Norte", sequence: 1, status: "PENDING", location: { latitude: -12.04, longitude: -77.03 } }], createdAt: "2026-08-26T10:00:00Z", updatedAt: "2026-08-26T11:00:00Z", version: 1 };
beforeEach(() => state.request.mockReset());

test("conserva identificadores y ubicación efímeros para el detalle sin exponerlos en el contrato de optimización", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [route], page: { page: 2, pageSize: 10, totalElements: 21, totalPages: 3 } }), { status: 200 }));
  const result = await listRoutes({ page: 2, pageSize: 10, date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED" });
  expect(state.request).toHaveBeenCalledWith("/routes?page=2&pageSize=10&date=2026-08-26&sellerId=seller-1&status=PUBLISHED", expect.anything(), { publishErrors: false });
  expect(result.page?.items[0]).toMatchObject({ id: "route-1", points: [{ sequence: 1, customerName: "Comercial Norte" }] });
  expect(result.page?.items[0]?.points[0]).toHaveProperty("customerId", "customer-1");
  expect(result.page?.items[0]?.points[0]).toMatchObject({ location: { latitude: -12.04, longitude: -77.03 } });
});

test("acepta una ruta sin ubicación para degradar el mapa sin perder el orden", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [{ ...route, points: [{ ...route.points[0], location: null }] }], page: { page: 0, pageSize: 5, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listRoutes({ page: 0, pageSize: 5, date: "", sellerId: null, status: null })).resolves.toMatchObject({ page: { items: [{ points: [{ customerName: "Comercial Norte" }] }] } });
});

test("consulta el detalle usando un ID codificado y no expone el payload adicional", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify(route), { status: 200 }));
  await expect(getRoute("route/1")).resolves.toMatchObject({ route: { id: "route-1", points: [{ customerName: "Comercial Norte" }] } });
  expect(state.request).toHaveBeenCalledWith("/routes/route%2F1", expect.anything(), { publishErrors: false });
});

test("solicita Directions con contrato neutral y descarta propiedades adicionales", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ geometry: [{ latitude: -12.04, longitude: -77.03 }, { latitude: -12.05, longitude: -77.04 }], legs: [{ distanceMeters: 1200, durationSeconds: 300, instructions: [{ text: "Gire", distanceMeters: 1200, durationSeconds: 300, providerDebug: "secret" }] }], distanceMeters: 1200, durationSeconds: 300, customerId: "customer-1" }), { status: 200 }));
  const result = await getRouteDirections("route/1");
  expect(state.request).toHaveBeenCalledWith("/routes/route%2F1/directions", expect.objectContaining({ method: "GET" }), { publishErrors: false });
  expect(result.directions).toEqual({ geometry: [{ latitude: -12.04, longitude: -77.03 }, { latitude: -12.05, longitude: -77.04 }], legs: [{ distanceMeters: 1200, durationSeconds: 300, instructions: [{ text: "Gire", distanceMeters: 1200, durationSeconds: 300 }] }], distanceMeters: 1200, durationSeconds: 300 });
  expect(result.directions).not.toHaveProperty("customerId");
});

test("previsualiza Directions sin persistir el orden ni enviar datos de clientes", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ geometry: [], legs: [], distanceMeters: 0, durationSeconds: 0 }), { status: 200 }));
  await previewRouteDirections("route/1", 3, ["point-2", "point-1"]);
  expect(state.request).toHaveBeenCalledWith("/routes/route%2F1/directions/preview", expect.objectContaining({ method: "POST", body: JSON.stringify({ baseRouteVersion: 3, routePointIds: ["point-2", "point-1"] }) }), { publishErrors: false });
});

test("carga vendedores paginados con su disponibilidad y territorios, sin consultas por ruta", async () => {
  state.request.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "seller-1", displayName: "Ana", status: "ACTIVE", territoryIds: ["territory-1"] }], page: { page: 0, pageSize: 100, totalElements: 2, totalPages: 2 } }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "seller-2", displayName: "Luis", status: "INACTIVE", territoryIds: [] }], page: { page: 1, pageSize: 100, totalElements: 2, totalPages: 2 } }), { status: 200 }));
  await expect(listRouteSellerOptions()).resolves.toMatchObject({ sellers: [{ label: "Ana", status: "ACTIVE", territoryIds: ["territory-1"] }, { label: "Luis", status: "INACTIVE", territoryIds: [] }] });
  expect(state.request).toHaveBeenNthCalledWith(1, "/sellers?page=0&pageSize=100", expect.anything(), { publishErrors: false });
  expect(state.request).toHaveBeenNthCalledWith(2, "/sellers?page=1&pageSize=100", expect.anything(), { publishErrors: false });
});

test("envía windows vacío cuando una visita no tiene restricción, deriva el territorio y conserva su versión para el orden posterior", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ routeId: "route-1", proposalVersion: 3, baseRouteVersion: 1, published: false, orderedVisits: [{ customerId: "customer-1", sequence: 1, plannedArrivalAt: "2026-08-26T09:00:00Z", plannedDepartureAt: "2026-08-26T09:30:00Z" }], unassignedVisits: [], totalTravelSeconds: 1, totalServiceSeconds: 1, totalDistanceMeters: 1, optimality: "OPTIMAL", generatedAt: "2026-08-26T08:00:00Z" }), { status: 200 }));
  await expect(optimizeRoute({ routeId: "route-1", availability: { start: "2026-08-26T08:00:00Z", end: "2026-08-26T17:00:00Z" }, baseRouteVersion: 1, visits: [{ customerId: "customer-1", serviceDurationSeconds: 1800, priority: 2, windows: [] }] })).resolves.toMatchObject({ proposal: { proposalVersion: 3, orderedVisits: [{ customerId: "customer-1", sequence: 1 }] } });
  expect(JSON.parse(state.request.mock.calls[0]?.[1].body as string)).toMatchObject({ visits: [{ customerId: "customer-1", windows: [] }] });
  expect(state.request).toHaveBeenCalledWith("/routes/optimize", expect.objectContaining({ method: "POST", body: expect.not.stringContaining("territoryId") }), { publishErrors: false });
});

test("consulta cartera completa y sugerencias como fuentes separadas, conservando solo el territorio necesario", async () => {
  state.request.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "customer-1", name: "Comercial Norte", territoryId: "territory-1", phone: "secreto" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ customer: { id: "customer-2", name: "Comercial Sur", territoryId: "territory-1", address: "secreto" }, priority: 1, reason: "Vencido" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listRouteCustomers("seller-1", 0)).resolves.toMatchObject({ page: { items: [{ id: "customer-1", label: "Comercial Norte", territoryId: "territory-1", suggested: false }] } });
  await expect(listSuggestedRouteCustomers("seller-1", "2026-08-26", 0)).resolves.toMatchObject({ page: { items: [{ id: "customer-2", label: "Comercial Sur", territoryId: "territory-1", suggested: true }] } });
  expect(state.request).toHaveBeenNthCalledWith(1, "/customers?sellerId=seller-1&page=0&pageSize=100", expect.anything(), { publishErrors: false });
  expect(state.request).toHaveBeenNthCalledWith(2, "/routes/suggested-customers?sellerId=seller-1&date=2026-08-26&page=0&pageSize=100", expect.anything(), { publishErrors: false });
});

test("crea con visitas ordenadas, sin startLocation, y reordena con versión y solo IDs opacos de puntos", async () => {
  state.request.mockResolvedValueOnce(new Response(JSON.stringify(route), { status: 201 })).mockResolvedValueOnce(new Response(JSON.stringify(route), { status: 200 }));
  await createRoute({ date: "2026-08-26", sellerId: "seller-1", visits: [{ customerId: "customer-1", serviceDurationSeconds: 1800 }] }, "00000000-0000-4000-8000-000000000001");
  await reorderRoutePoints({ ...route, status: "PUBLISHED" as const, points: [{ routePointId: "point-1", sequence: 1, customerName: "Comercial Norte" }] }, [{ routePointId: "point-1", sequence: 1, customerName: "Comercial Norte" }]);
  expect(state.request).toHaveBeenNthCalledWith(1, "/routes", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": "00000000-0000-4000-8000-000000000001" }), body: JSON.stringify({ date: "2026-08-26", sellerId: "seller-1", visits: [{ customerId: "customer-1", serviceDurationSeconds: 1800 }] }) }), { publishErrors: false });
  expect(JSON.parse(state.request.mock.calls[0]?.[1].body as string)).not.toHaveProperty("startLocation");
  expect(state.request).toHaveBeenNthCalledWith(2, "/routes/route-1/points/order", expect.objectContaining({ method: "PUT", headers: expect.objectContaining({ "If-Match": "\"1\"" }), body: JSON.stringify({ routePointIds: ["point-1"] }) }), { publishErrors: false });
});

test("publica con correlación, idempotencia y la versión vigente", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ ...route, status: "PUBLISHED", version: 2 }), { status: 200 }));
  await expect(publishRoute({ ...route, status: "DRAFT" }, false, "00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002")).resolves.toMatchObject({ route: { status: "PUBLISHED", version: 2 } });
  expect(state.request).toHaveBeenCalledWith("/routes/route-1/publish", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "X-Correlation-Id": "00000000-0000-4000-8000-000000000002", "Idempotency-Key": "00000000-0000-4000-8000-000000000001", "If-Match": "\"1\"", "X-CSRF-Token": "csrf" }), body: JSON.stringify({ notifySeller: false }) }), { publishErrors: false });
});
