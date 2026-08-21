import { beforeEach, expect, test, vi } from "vitest";
import { changeClientStatus, checkClientDuplicate, createClient, getClient, listActiveTerritories, listAllClients, listClientFilterOptions, listClients, updateClient } from "./api";
import type { Client } from "./types";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({
  getSessionAuthorization: () => ({ Authorization: "Bearer session" }),
  getSessionMutationAuthorization: () => ({ Authorization: "Bearer session", "X-CSRF-Token": "csrf" }),
}));

const client = { id: "customer-1", name: "Comercial Norte", segment: "Mayorista", territoryId: null, assignedSellerIds: ["seller-1"], status: "ACTIVE", location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 } satisfies Client;
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

test("carga todas las páginas para el mapa general sin exponer un paginador", async () => {
  state.request
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [client], page: { page: 0, pageSize: 200, totalElements: 2, totalPages: 2 } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...client, id: "customer-2" }], page: { page: 1, pageSize: 200, totalElements: 2, totalPages: 2 } }), { status: 200 }));

  await expect(listAllClients({ search: "", status: null, territoryId: null, sellerId: null, withoutVisitSince: "", withoutPurchaseSince: "" })).resolves.toMatchObject({ page: { items: [{ id: "customer-1" }, { id: "customer-2" }], page: { totalElements: 2, totalPages: 1 } } });
  expect(state.request).toHaveBeenNthCalledWith(1, "/customers?page=0&pageSize=200", expect.anything(), { publishErrors: false });
  expect(state.request).toHaveBeenNthCalledWith(2, "/customers?page=1&pageSize=200", expect.anything(), { publishErrors: false });
});

test("acepta opcionales nulos o ausentes en el cliente recién creado", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [
    { ...client, segment: null, territoryId: null },
    Object.fromEntries(Object.entries(client).filter(([field]) => field !== "segment" && field !== "territoryId")),
  ], page: { page: 0, pageSize: 5, totalElements: 2, totalPages: 1 } }), { status: 200 }));

  await expect(listClients({ page: 0, pageSize: 5, search: "", status: null, territoryId: null, sellerId: null, withoutVisitSince: "", withoutPurchaseSince: "" })).resolves.toMatchObject({
    page: { items: [{ segment: null, territoryId: null }, { segment: null, territoryId: null }] },
  });
});

test("crea y actualiza con cuerpo contractual y valida el Customer devuelto", async () => {
  const input = { name: " Comercial Norte ", address: " Av. Lima 1 ", documentType: " DNI ", documentNumber: " 12345678 ", phone: " 999999999 ", email: " contacto@example.com ", segment: " Mayorista ", visitFrequencyDays: 30, territoryId: null, latitude: -12.04, longitude: -77.03 };
  state.request.mockResolvedValueOnce(new Response(JSON.stringify({ ...client, segment: null, territoryId: null }), { status: 201 }));

  await expect(createClient(input)).resolves.toMatchObject({ response: expect.objectContaining({ status: 201 }), client: { id: client.id, segment: null, territoryId: null } });
  expect(state.request).toHaveBeenCalledWith("/customers", expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Comercial Norte", address: "Av. Lima 1", documentType: "DNI", documentNumber: "12345678", phone: "999999999", email: "contacto@example.com", segment: "Mayorista", visitFrequencyDays: 30, location: { latitude: -12.04, longitude: -77.03 } }) }), { publishErrors: false });

  state.request.mockResolvedValueOnce(new Response(JSON.stringify({ id: client.id }), { status: 200 }));
  await expect(updateClient(client, input)).resolves.toMatchObject({ client: null });
  expect(state.request).toHaveBeenLastCalledWith(`/customers/${client.id}`, expect.objectContaining({ method: "PATCH", headers: expect.objectContaining({ "If-Match": '"1"' }) }), { publishErrors: false });
});

test("cambia solo el estado con control de versión", async () => {
  const inactive = { ...client, status: "INACTIVE", version: 2 } as const;
  state.request.mockResolvedValue(new Response(JSON.stringify(inactive), { status: 200 }));

  await expect(changeClientStatus(client, "INACTIVE")).resolves.toMatchObject({ client: { status: "INACTIVE", version: 2 } });
  expect(state.request).toHaveBeenCalledWith(`/customers/${client.id}`, {
    method: "PATCH",
    headers: expect.objectContaining({ "If-Match": '"1"', "X-CSRF-Token": "csrf" }),
    body: JSON.stringify({ status: "INACTIVE" }),
  }, { publishErrors: false });
});

test("omite opcionales vacíos y no serializa una frecuencia inválida", async () => {
  const input = { name: "Comercial Norte", address: "Av. Lima 1", documentType: " ", documentNumber: "", phone: "", email: "", segment: " ", visitFrequencyDays: 366, territoryId: null, latitude: -12.04, longitude: -77.03 };
  state.request.mockResolvedValue(new Response(JSON.stringify(client), { status: 201 }));

  await createClient(input);

  expect(state.request).toHaveBeenCalledWith("/customers", expect.objectContaining({ body: JSON.stringify({ name: "Comercial Norte", address: "Av. Lima 1", location: { latitude: -12.04, longitude: -77.03 } }) }), { publishErrors: false });
});

test("envía el chequeo de duplicados contractual y solo acepta candidatos válidos", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ hasPossibleDuplicates: true, candidates: [{ customer: client, score: 0.87, matchedFields: ["name", "phone"] }] }), { status: 200 }));

  await expect(checkClientDuplicate({ name: " Comercial Norte ", documentNumber: "12345678", phone: "999999999", address: " Av. Lima 1 ", latitude: -12.04, longitude: -77.03, excludeCustomerId: client.id })).resolves.toMatchObject({ result: { hasPossibleDuplicates: true, candidates: [{ id: client.id }] } });
  expect(state.request).toHaveBeenCalledWith("/customers/duplicate-checks", expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Comercial Norte", documentNumber: "12345678", phone: "999999999", address: "Av. Lima 1", location: { latitude: -12.04, longitude: -77.03 }, excludeCustomerId: client.id }) }), { publishErrors: false });

  state.request.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
  await expect(checkClientDuplicate({ name: "Comercial Norte", documentNumber: "", phone: "", address: "Av. Lima 1", latitude: -12.04, longitude: -77.03, excludeCustomerId: null })).resolves.toMatchObject({ result: null });
});

test("precarga el detalle y normaliza opcionales ausentes o nulos", async () => {
  const withoutListOptionals = Object.fromEntries(Object.entries(client).filter(([field]) => field !== "segment" && field !== "territoryId"));
  state.request.mockResolvedValue(new Response(JSON.stringify({ ...withoutListOptionals, address: "Av. Lima 1", documentType: null, phone: null }), { status: 200 }));

  await expect(getClient(client.id)).resolves.toMatchObject({ client: {
    address: "Av. Lima 1", documentType: null, documentNumber: null, phone: null, email: null, segment: null, visitFrequencyDays: null,
  } });
});

test("carga solo las referencias permitidas para etiquetas de filtros", async () => {
  state.request.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "territory-1", name: "Centro", code: "CEN" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "seller-1", displayName: "Ana" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  await expect(listClientFilterOptions()).resolves.toMatchObject({ options: { territories: [{ label: "Centro" }], sellers: [{ label: "Ana" }] } });
  expect(state.request).toHaveBeenNthCalledWith(1, "/territories?page=0&pageSize=100", expect.anything(), { publishErrors: false });
  expect(state.request).toHaveBeenNthCalledWith(2, "/sellers?page=0&pageSize=100", expect.anything(), { publishErrors: false });
});

test("pagina territorios activos conservando el filtro y el código real", async () => {
  state.request
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "territory-1", name: "Centro", code: "CEN" }], page: { page: 0, pageSize: 100, totalElements: 2, totalPages: 2 } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "territory-2", name: "Norte", code: "NOR" }], page: { page: 1, pageSize: 100, totalElements: 2, totalPages: 2 } }), { status: 200 }));

  await expect(listActiveTerritories()).resolves.toMatchObject({
    territories: [
      { id: "territory-1", name: "Centro", code: "CEN" },
      { id: "territory-2", name: "Norte", code: "NOR" },
    ],
  });
  expect(state.request).toHaveBeenNthCalledWith(1, "/territories?status=ACTIVE&page=0&pageSize=100", expect.anything(), { publishErrors: false });
  expect(state.request).toHaveBeenNthCalledWith(2, "/territories?status=ACTIVE&page=1&pageSize=100", expect.anything(), { publishErrors: false });
});
