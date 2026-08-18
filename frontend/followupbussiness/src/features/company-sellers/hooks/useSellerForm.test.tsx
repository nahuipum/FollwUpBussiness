import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useSellerForm } from "./useSellerForm";

const state = vi.hoisted(() => ({
  listener: undefined as (() => void) | undefined,
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  supervisor: vi.fn(),
  territories: vi.fn(),
}));
vi.mock("../../auth/auth", () => ({
  subscribeToSession: (listener: () => void) => {
    state.listener = listener;
    return () => undefined;
  },
}));
vi.mock("../api", () => ({
  listSellerFormOptions: state.list,
  createSeller: state.create,
  updateSeller: state.update,
  updateSellerSupervisor: state.supervisor,
  updateSellerTerritories: state.territories,
}));

const seller = {
  id: "seller-1",
  userId: "user-1",
  displayName: "Ana",
  email: "ana@example.com",
  phone: null,
  employeeCode: null,
  supervisorId: null,
  territoryIds: [],
  supervisor: null,
  territories: [],
  status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  version: 1,
};
const input = {
  displayName: "Ana",
  email: "ana@example.com",
  username: "",
  phone: "",
  employeeCode: "",
  supervisorId: null,
  territoryIds: [],
};
const response = (status: number) => new Response(null, { status });

beforeEach(() => {
  state.listener = undefined;
  state.list
    .mockReset()
    .mockResolvedValue({
      response: response(200),
      options: { supervisors: [], territories: [] },
    });
  state.create.mockReset();
  state.update.mockReset();
  state.supervisor.mockReset();
  state.territories.mockReset();
});

async function openEditor(result: {
  current: ReturnType<typeof useSellerForm>;
}) {
  act(() => result.current.open(seller));
  await waitFor(() => expect(result.current.options).not.toBeNull());
}

test("409 conserva el diálogo y recarga el listado solo mediante la acción explícita", async () => {
  const saved = vi.fn();
  const { result } = renderHook(() => useSellerForm(saved));
  await openEditor(result);
  state.update.mockResolvedValue(response(409));
  await act(async () => {
    await result.current.submit(input);
  });
  expect(result.current.conflict).toBe(true);
  expect(result.current.seller).toBe(seller);
  act(() => result.current.reloadAfterConflict());
  expect(saved).toHaveBeenCalledOnce();
  expect(result.current.seller).toBe(seller);
});

test("fallo parcial refresca el listado y mantiene el formulario para corregir", async () => {
  const saved = vi.fn();
  const { result } = renderHook(() => useSellerForm(saved));
  await openEditor(result);
  state.update.mockResolvedValue(response(200));
  state.supervisor.mockResolvedValue(response(500));
  await act(async () => {
    await result.current.submit(input);
  });
  expect(result.current.error).toContain("asignación de supervisor");
  expect(result.current.seller).toBe(seller);
  expect(saved).toHaveBeenCalledOnce();
});

test("cambio de sesión cierra el diálogo y revoca las opciones cargadas", async () => {
  const { result } = renderHook(() => useSellerForm(() => undefined));
  await openEditor(result);
  act(() => state.listener?.());
  expect(result.current.seller).toBeUndefined();
  expect(result.current.options).toBeNull();
});
