import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useSellerAssignment } from "./useSellerAssignment";

const state = vi.hoisted(() => ({ options: vi.fn(), supervisor: vi.fn(), territories: vi.fn() }));
vi.mock("../api", () => ({
  listSellerFormOptions: state.options,
  updateSellerSupervisor: state.supervisor,
  updateSellerTerritories: state.territories,
}));

const seller = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1,
};

beforeEach(() => {
  state.options.mockReset().mockResolvedValue({ response: new Response(null, { status: 200 }), options: { supervisors: [], territories: [] } });
  state.supervisor.mockReset();
  state.territories.mockReset();
});

test("guarda territorios, cierra el diálogo y actualiza el listado", async () => {
  state.territories.mockResolvedValue(new Response(null, { status: 200 }));
  const saved = vi.fn();
  const { result } = renderHook(() => useSellerAssignment("tenant-a", saved));

  act(() => result.current.open(seller, "territories"));
  await waitFor(() => expect(result.current.options).not.toBeNull());
  await act(async () => { await result.current.submit(["territory-1"]); });

  expect(state.territories).toHaveBeenCalledWith("seller-1", ["territory-1"]);
  expect(result.current.seller).toBeNull();
  expect(result.current.kind).toBeNull();
  expect(saved).toHaveBeenCalledOnce();
});

test("conserva el diálogo y muestra error cuando guardar territorios falla", async () => {
  state.territories.mockResolvedValue(new Response(null, { status: 422 }));
  const { result } = renderHook(() => useSellerAssignment("tenant-a", () => undefined));

  act(() => result.current.open(seller, "territories"));
  await waitFor(() => expect(result.current.options).not.toBeNull());
  await act(async () => { await result.current.submit(["territory-1"]); });

  expect(result.current.seller).toBe(seller);
  expect(result.current.error?.status).toBe(422);
});

test("cierra la asignación y descarta sus opciones al cambiar de empresa", async () => {
  const { result, rerender } = renderHook(
    ({ sessionKey }) => useSellerAssignment(sessionKey, () => undefined),
    { initialProps: { sessionKey: "tenant-a" } },
  );

  act(() => result.current.open(seller, "territories"));
  await waitFor(() => expect(result.current.options).not.toBeNull());
  rerender({ sessionKey: "tenant-b" });

  await waitFor(() => expect(result.current.seller).toBeNull());
  expect(result.current.kind).toBeNull();
  expect(result.current.options).toBeNull();
});
