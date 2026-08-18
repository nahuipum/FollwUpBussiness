import { beforeEach, expect, test, vi } from "vitest";
import { listSellers } from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({ getSessionAuthorization: () => ({ Authorization: "Bearer session" }) }));

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana Vendedora", email: "ana@example.com",
  phone: null, employeeCode: "VEN-001", status: "ACTIVE", supervisorId: "supervisor-1",
  territoryIds: ["territory-1"], supervisor: { id: "supervisor-1", displayName: "Sofía Supervisora" },
  territories: [{ id: "territory-1", code: "LIM", name: "Lima Centro" }],
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};

beforeEach(() => { state.request.mockReset(); });

test("solicita filtros contractuales por ID y conserva las etiquetas enriquecidas", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [seller], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  const result = await listSellers({ page: 0, pageSize: 20, search: "Ana", status: "ACTIVE", supervisorId: "supervisor-1", territoryId: "territory-1" });
  expect(state.request).toHaveBeenCalledWith("/sellers?page=0&pageSize=20&search=Ana&status=ACTIVE&supervisorId=supervisor-1&territoryId=territory-1", expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer session" } }));
  expect(result.page?.items[0]).toMatchObject({ supervisor: { displayName: "Sofía Supervisora" }, territories: [{ name: "Lima Centro" }] });
});

test("rechaza una respuesta exitosa sin relaciones enriquecidas", async () => {
  const withoutSupervisor = { ...seller, supervisor: undefined };
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [withoutSupervisor], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listSellers({ page: 0, pageSize: 20, search: "", status: null, supervisorId: null, territoryId: null })).resolves.toMatchObject({ page: null });
});
