import { beforeEach, expect, test, vi } from "vitest";
import { createTerritory, listTerritories, updateTerritory } from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({ getSessionAuthorization: () => ({ Authorization: "Bearer session" }), getSessionMutationAuthorization: () => ({ Authorization: "Bearer mutation" }) }));

const territory = { id: "territory-1", name: "Lima Centro", code: "LIM", description: null, status: "ACTIVE" as const, assignedSellerCount: 3, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 2 };

beforeEach(() => state.request.mockReset());

test("lista zonas con filtros contractuales y expone el conteo de vendedores", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [territory], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  const result = await listTerritories({ page: 0, pageSize: 20, search: "Lima", status: "ACTIVE" });
  expect(state.request).toHaveBeenCalledWith("/territories?page=0&pageSize=20&search=Lima&status=ACTIVE", expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer session" } }));
  expect(result.page?.items[0]).toMatchObject({ assignedSellerCount: 3 });
});

test("rechaza un territorio exitoso sin conteo de vendedores", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [{ ...territory, assignedSellerCount: undefined }], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listTerritories({ page: 0, pageSize: 20, search: "", status: null })).resolves.toMatchObject({ page: null });
});

test("crea y actualiza sin boundary, con If-Match al editar", async () => {
  state.request.mockResolvedValue(new Response(null, { status: 200 }));
  const input = { name: "Lima Centro", code: "LIM", description: "Centro", status: "INACTIVE" as const };
  await createTerritory(input); await updateTerritory(territory, input);
  expect(state.request).toHaveBeenNthCalledWith(1, "/territories", expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Lima Centro", code: "LIM", description: "Centro" }) }));
  expect(state.request).toHaveBeenNthCalledWith(2, "/territories/territory-1", expect.objectContaining({ method: "PATCH", headers: expect.objectContaining({ "If-Match": "2" }), body: JSON.stringify({ name: "Lima Centro", code: "LIM", description: "Centro", status: "INACTIVE" }) }));
});
