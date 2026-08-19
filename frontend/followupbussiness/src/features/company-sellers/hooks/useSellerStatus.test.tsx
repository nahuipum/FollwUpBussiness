import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useSellerStatus } from "./useSellerStatus";

const state = vi.hoisted(() => ({ change: vi.fn() }));
vi.mock("../api", () => ({ changeSellerStatus: state.change }));

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};

beforeEach(() => state.change.mockReset());

test("actualiza solo con la respuesta exitosa y bloquea el doble envío", async () => {
  let resolve!: (value: unknown) => void;
  state.change.mockReturnValue(new Promise((done) => { resolve = done; }));
  const saved = vi.fn();
  const { result } = renderHook(() => useSellerStatus("tenant-a", saved));
  act(() => { result.current.open(seller); result.current.setReason("Cambio solicitado"); });
  await act(async () => { void result.current.submit(); await Promise.resolve(); });
  await act(async () => { void result.current.submit(); await Promise.resolve(); });
  expect(state.change).toHaveBeenCalledOnce();
  expect(result.current.busy).toBe(true);
  await act(async () => {
    resolve({ response: new Response(JSON.stringify({ ...seller, status: "INACTIVE" }), { status: 200 }), seller: { ...seller, status: "INACTIVE" } });
    await Promise.resolve();
  });
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ status: "INACTIVE" })));
  expect(result.current.seller).toBeNull();
});

test.each([403, 404, 409])("conserva el diálogo y la fila ante %i", async (status) => {
  state.change.mockResolvedValue({ response: new Response(null, { status }), seller: null });
  const saved = vi.fn();
  const { result } = renderHook(() => useSellerStatus("tenant-a", saved));
  act(() => { result.current.open(seller); result.current.setReason("Cambio solicitado"); });
  await act(async () => { await result.current.submit(); });
  expect(result.current.seller).toBe(seller);
  expect(result.current.reason).toBe("Cambio solicitado");
  expect(result.current.error?.status).toBe(status);
  expect(saved).not.toHaveBeenCalled();
});

test("conserva el diálogo ante un error de red simulado y lo limpia al cambiar de empresa", async () => {
  state.change.mockResolvedValue({ response: new Response(null, { status: 500 }), seller: null });
  const { result, rerender } = renderHook(({ key }) => useSellerStatus(key, () => undefined), { initialProps: { key: "tenant-a" } });
  act(() => { result.current.open(seller); result.current.setReason("Cambio solicitado"); });
  await act(async () => { await result.current.submit(); });
  expect(result.current.seller).toBe(seller);
  expect(result.current.error?.status).toBe(500);
  rerender({ key: "tenant-b" });
  await waitFor(() => expect(result.current.seller).toBeNull());
  expect(result.current.reason).toBe("");
});
