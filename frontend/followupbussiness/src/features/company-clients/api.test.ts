import { beforeEach, expect, test, vi } from "vitest";
import { listClientFilterOptions, listClients } from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({ getSessionAuthorization: () => ({ Authorization: "Bearer session" }) }));

const client = { id: "customer-1", name: "Comercial Norte", segment: "Mayorista", territoryId: null, assignedSellerIds: ["seller-1"], status: "ACTIVE", location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 };
beforeEach(() => state.request.mockReset());

test("envía todos los filtros contractuales y omite PII del modelo de lista", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [client], page: { page: 2, pageSize: 10, totalElements: 21, totalPages: 3 } }), { status: 200 }));
  const result = await listClients({ page: 2, pageSize: 10, search: "Mayorista", status: "ACTIVE", territoryId: "territory-1", sellerId: "seller-1", withoutVisitSince: "2026-02-01", withoutPurchaseSince: "2026-03-01" });
  expect(state.request).toHaveBeenCalledWith("/customers?page=2&pageSize=10&search=Mayorista&status=ACTIVE&territoryId=territory-1&sellerId=seller-1&withoutVisitSince=2026-02-01&withoutPurchaseSince=2026-03-01", expect.objectContaining({ headers: { Authorization: "Bearer session" } }), { publishErrors: false });
  expect(result.page?.items[0]).toMatchObject({ name: "Comercial Norte", assignedSellerIds: ["seller-1"] });
  expect(result.page?.items[0]).not.toHaveProperty("email");
});

test("rechaza CustomerPage exitosa sin ubicación contractual", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [{ ...client, location: null }], page: { page: 0, pageSize: 5, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listClients({ page: 0, pageSize: 5, search: "", status: null, territoryId: null, sellerId: null, withoutVisitSince: "", withoutPurchaseSince: "" })).resolves.toMatchObject({ page: null });
});

test("carga solo las referencias permitidas para etiquetas de filtros", async () => {
  state.request.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "territory-1", name: "Centro", code: "CEN" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "seller-1", displayName: "Ana" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listClientFilterOptions()).resolves.toMatchObject({ options: { territories: [{ label: "Centro" }], sellers: [{ label: "Ana" }] } });
  expect(state.request).toHaveBeenNthCalledWith(1, "/territories?page=0&pageSize=100", expect.anything(), { publishErrors: false });
  expect(state.request).toHaveBeenNthCalledWith(2, "/sellers?page=0&pageSize=100", expect.anything(), { publishErrors: false });
});
