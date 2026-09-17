import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useCustomerAssignments } from "./useCustomerAssignments";

const state = vi.hoisted(() => ({ generation: 1, identity: { id: "admin-a", company: { id: "tenant-a" } }, listener: undefined as (() => void) | undefined, one: vi.fn(), batch: vi.fn(), load: vi.fn() }));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => state.generation, getSessionIdentity: () => state.identity, subscribeToSession: (listener: () => void) => { state.listener = listener; return () => { state.listener = undefined; }; } }));
vi.mock("../api", () => ({ assignOne: state.one, assignBatch: state.batch, loadAssignmentOptions: state.load }));

beforeEach(() => { state.generation = 1; state.identity = { id: "admin-a", company: { id: "tenant-a" } }; state.listener = undefined; state.one.mockReset(); state.batch.mockReset(); state.load.mockResolvedValue({ response: new Response(null, { status: 200 }), clients: [], sellers: [], territories: [] }); });

test("descarta una asignación pendiente cuando logout o cambio de empresa reemplaza la sesión", async () => {
  let resolve: ((value: null) => void) | undefined;
  state.one.mockImplementation(() => new Promise<null>((done) => { resolve = done; }));
  const { result } = renderHook(() => useCustomerAssignments());
  await act(async () => {});
  let submitted: Promise<boolean> | undefined;
  act(() => { submitted = result.current.submit({ customerIds: ["customer-a"], sellerIds: ["seller-a"], effectiveFrom: "2026-08-20", reason: "" }, "intent-a"); });
  state.generation = 2; state.identity = { id: "admin-b", company: { id: "tenant-b" } };
  act(() => { state.listener?.(); });
  await act(async () => { resolve?.(null); await submitted; });
  expect(result.current.results).toEqual([]);
  expect(state.load).toHaveBeenCalledTimes(2);
});

test("limpia la cartera anterior y carga la del nuevo tenant tras cambiar de empresa", async () => {
  const tenantA = { response: new Response(null, { status: 200 }), clients: [{ id: "customer-a", name: "Cliente A", status: "ACTIVE" as const, territoryId: null, assignedSellerIds: [] }], sellers: [], territories: [] };
  const tenantB = { response: new Response(null, { status: 200 }), clients: [{ id: "customer-b", name: "Cliente B", status: "ACTIVE" as const, territoryId: null, assignedSellerIds: [] }], sellers: [], territories: [] };
  let resolve: ((value: typeof tenantB) => void) | undefined;
  state.load.mockResolvedValueOnce(tenantA).mockImplementationOnce(() => new Promise<typeof tenantB>((done) => { resolve = done; }));
  const { result } = renderHook(() => useCustomerAssignments());
  await act(async () => {});
  expect(result.current.clients.map((client) => client.id)).toEqual(["customer-a"]);
  const loadsBeforeChange = state.load.mock.calls.length;

  state.generation = 2; state.identity = { id: "admin-b", company: { id: "tenant-b" } };
  act(() => { state.listener?.(); });
  expect(result.current.clients).toEqual([]);
  expect(result.current.loading).toBe(true);

  await act(async () => { resolve?.(tenantB); });
  expect(result.current.clients.map((client) => client.id)).toEqual(["customer-b"]);
  expect(state.load).toHaveBeenCalledTimes(loadsBeforeChange + 1);
});

const previous = { response: new Response(null, { status: 200 }), clients: [{ id: "customer-a", name: "Cliente A", status: "ACTIVE" as const, territoryId: null, assignedSellerIds: [] }], sellers: [{ id: "seller-a", displayName: "Vendedora A", status: "ACTIVE" as const }], territories: [] };
const denied = { response: new Response(null, { status: 403 }), clients: null, sellers: null, territories: null };
const input = { customerIds: ["customer-a"], sellerIds: ["seller-a"], effectiveFrom: "2026-08-20", reason: "" };

test("GET 403 tras una carga válida elimina cartera, resultados y fecha", async () => {
  state.load.mockResolvedValueOnce(previous).mockResolvedValueOnce(denied);
  const { result } = renderHook(() => useCustomerAssignments());
  await waitFor(() => expect(result.current.clients.map(client => client.id)).toEqual(["customer-a"]));
  act(() => result.current.reload());
  await waitFor(() => expect(result.current.error?.status).toBe(403));
  expect(result.current.clients).toEqual([]);
  expect(result.current.sellers).toEqual([]);
  expect(result.current.territories).toEqual([]);
  expect(result.current.results).toEqual([]);
  expect(result.current.lastUpdated).toBeNull();
  expect(await result.current.submit(input, "intent-a")).toBe(false);
  expect(state.one).not.toHaveBeenCalled();
});

test("PUT 403 revoca la cartera y evita repetir la operación", async () => {
  state.load.mockResolvedValueOnce(previous);
  state.one.mockResolvedValue({ status: 403, correlationId: null, fieldErrors: [] });
  const { result } = renderHook(() => useCustomerAssignments());
  await waitFor(() => expect(result.current.clients.map(client => client.id)).toEqual(["customer-a"]));
  await act(async () => { expect(await result.current.submit(input, "intent-a")).toBe(false); });
  expect(result.current.error?.status).toBe(403);
  expect(result.current.clients).toEqual([]);
  expect(result.current.sellers).toEqual([]);
  expect(result.current.lastUpdated).toBeNull();
  await act(async () => { expect(await result.current.submit(input, "intent-a")).toBe(false); });
  expect(state.one).toHaveBeenCalledTimes(1);
});
