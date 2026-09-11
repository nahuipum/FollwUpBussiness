import { beforeEach, expect, test, vi } from "vitest";
import {
  createSeller,
  changeSellerStatus,
  getSeller,
  listSellerFormOptions,
  listSellers,
  resendSellerInvitation,
  updateSeller,
  updateSellerSupervisor,
  updateSellerTerritories,
} from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({
  getSessionAuthorization: () => ({ Authorization: "Bearer session" }),
  getSessionMutationAuthorization: () => ({ Authorization: "Bearer mutation" }),
}));

const seller = {
  id: "seller-1",
  userId: "user-1",
  displayName: "Ana Vendedora",
  email: "ana@example.com",
  phone: null,
  employeeCode: "VEN-001",
  status: "ACTIVE" as const,
  supervisorId: "supervisor-1",
  territoryIds: ["territory-1"],
  supervisor: { id: "supervisor-1", displayName: "Sofía Supervisora" },
  territories: [{ id: "territory-1", code: "LIM", name: "Lima Centro" }],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  version: 1,
};

beforeEach(() => {
  state.request.mockReset();
});

test("solicita filtros contractuales por ID y conserva las etiquetas enriquecidas", async () => {
  state.request.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [seller],
        page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
      }),
      { status: 200 },
    ),
  );
  const result = await listSellers({
    page: 0,
    pageSize: 20,
    search: "Ana",
    status: "ACTIVE",
    supervisorId: "supervisor-1",
    territoryId: "territory-1",
  });
  expect(state.request).toHaveBeenCalledWith(
    "/sellers?page=0&pageSize=20&search=Ana&status=ACTIVE&supervisorId=supervisor-1&territoryId=territory-1",
    expect.objectContaining({
      method: "GET",
      headers: { Authorization: "Bearer session" },
    }),
    { publishErrors: expect.any(Function) },
  );
  expect(result.page?.items[0]).toMatchObject({
    supervisor: { displayName: "Sofía Supervisora" },
    territories: [{ name: "Lima Centro" }],
  });
});

test("rechaza una respuesta exitosa sin relaciones enriquecidas", async () => {
  const withoutSupervisor = { ...seller, supervisor: undefined };
  state.request.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [withoutSupervisor],
        page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
      }),
      { status: 200 },
    ),
  );
  await expect(
    listSellers({
      page: 0,
      pageSize: 20,
      search: "",
      status: null,
      supervisorId: null,
      territoryId: null,
    }),
  ).resolves.toMatchObject({ page: null });
});

test("conserva vendedores invitados devueltos al crear la cuenta", async () => {
  state.request.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [{ ...seller, status: "INVITED" }],
        page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 },
      }),
      { status: 200 },
    ),
  );
  const result = await listSellers({
    page: 0, pageSize: 20, search: "", status: null, supervisorId: null, territoryId: null,
  });
  expect(result.page?.items[0]?.status).toBe("INVITED");
});

test("consulta el vendedor actual con la autorización de sesión", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify(seller), { status: 200 }));
  const result = await getSeller(seller.id);
  expect(state.request).toHaveBeenCalledWith(
    "/sellers/seller-1",
    expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer session" } }),
    { publishErrors: expect.any(Function) },
  );
  expect(result.seller?.version).toBe(1);
});

test("carga referencias activas paginadas sin solicitudes por opción", async () => {
  state.request
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [{ id: "supervisor-1", displayName: "Sofía Supervisora" }],
          page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 },
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [{ id: "territory-1", code: "LIM", name: "Lima Centro" }],
          page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 },
        }),
        { status: 200 },
      ),
    );
  await expect(listSellerFormOptions()).resolves.toMatchObject({
    options: {
      supervisors: [{ displayName: "Sofía Supervisora" }],
      territories: [{ code: "LIM" }],
    },
  });
  expect(state.request).toHaveBeenNthCalledWith(
    1,
    "/company/users?role=SUPERVISOR&status=ACTIVE&page=0&pageSize=100",
    expect.anything(),
    { publishErrors: expect.any(Function) },
  );
  expect(state.request).toHaveBeenNthCalledWith(
    2,
    "/territories?status=ACTIVE&page=0&pageSize=100",
    expect.anything(),
    { publishErrors: expect.any(Function) },
  );
});

test("envía creación y edición con precondición y asignaciones sin duplicados", async () => {
  state.request.mockResolvedValue(new Response(null, { status: 200 }));
  const input = {
    displayName: "Ana Vendedora",
    email: "ana@example.com",
    username: "ana",
    phone: "999",
    employeeCode: "VEN-1",
    supervisorId: "supervisor-1",
    territoryIds: ["territory-1", "territory-1"],
  };
  await createSeller(input);
  await updateSeller(seller, input);
  await updateSellerSupervisor(seller.id, null);
  await updateSellerTerritories(seller.id, input.territoryIds);
  expect(state.request).toHaveBeenNthCalledWith(
    1,
    "/sellers",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        displayName: "Ana Vendedora",
        email: "ana@example.com",
        username: "ana",
        phone: "999",
        employeeCode: "VEN-1",
        supervisorId: "supervisor-1",
        territoryIds: ["territory-1"],
      }),
    }),
    { publishErrors: expect.any(Function) },
  );
  expect(state.request).toHaveBeenNthCalledWith(
    2,
    "/sellers/seller-1",
    expect.objectContaining({
      method: "PATCH",
      headers: expect.objectContaining({ "If-Match": "1" }),
    }),
    { publishErrors: expect.any(Function) },
  );
  expect(state.request).toHaveBeenNthCalledWith(
    3,
    "/sellers/seller-1/supervisor",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ supervisorId: null }),
    }),
    { publishErrors: expect.any(Function) },
  );
  expect(state.request).toHaveBeenNthCalledWith(
    4,
    "/sellers/seller-1/territories",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ territoryIds: ["territory-1"] }),
    }),
    { publishErrors: expect.any(Function) },
  );
});

test("cambia el estado mediante PATCH con el motivo requerido", async () => {
  state.request.mockResolvedValue(
    new Response(JSON.stringify({ ...seller, status: "INACTIVE" }), {
      status: 200,
    }),
  );
  const result = await changeSellerStatus(seller.id, {
    status: "INACTIVE",
    reason: "Fin de relación comercial",
  });
  expect(state.request).toHaveBeenCalledWith(
    "/sellers/seller-1/status",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        status: "INACTIVE",
        reason: "Fin de relación comercial",
      }),
    }),
    { publishErrors: expect.any(Function) },
  );
  expect(result.seller?.status).toBe("INACTIVE");
});

test("reenvía la invitación con precondición y acepta el vendedor invitado", async () => {
  const invited = { ...seller, status: "INVITED" as const, version: 4 };
  state.request.mockResolvedValue(
    new Response(JSON.stringify({ ...invited, version: 5 }), { status: 202 }),
  );
  const result = await resendSellerInvitation(invited);
  expect(state.request).toHaveBeenCalledWith(
    "/sellers/seller-1/invitation",
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "If-Match": "4" }),
    }),
    { publishErrors: expect.any(Function) },
  );
  expect(result.seller?.status).toBe("INVITED");
});

test("mantiene los errores 500 dentro del feature y publica solo una sesión expirada", async () => {
  state.request.mockResolvedValue(new Response(null, { status: 500 }));
  await listSellers({
    page: 0,
    pageSize: 5,
    search: "",
    status: null,
    supervisorId: null,
    territoryId: null,
  });
  const options = state.request.mock.calls[0]?.[2] as {
    publishErrors: (status: number) => boolean;
  } | undefined;
  expect(options).toBeDefined();
  expect(options?.publishErrors(500)).toBe(false);
  expect(options?.publishErrors(401)).toBe(true);
});
