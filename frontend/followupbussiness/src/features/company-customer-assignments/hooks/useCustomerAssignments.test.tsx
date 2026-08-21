import { act, renderHook } from "@testing-library/react";
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
  expect(state.load).toHaveBeenCalledTimes(1);
});
