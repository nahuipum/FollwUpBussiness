import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useClientForm } from "./useClientForm";

const state = vi.hoisted(() => ({
  create: vi.fn(),
  territories: vi.fn(),
  listener: undefined as (() => void) | undefined,
  generation: 1,
  identity: {
    id: "admin-1",
    roles: ["COMPANY_ADMIN"],
    company: { id: "company-1" },
  } as { id: string; roles: string[]; company: { id: string } } | null,
}));
vi.mock("../../auth/auth", () => ({
  getSessionGeneration: () => state.generation,
  getSessionIdentity: () => state.identity,
  subscribeToSession: (listener: () => void) => { state.listener = listener; return () => undefined; },
}));
vi.mock("../api", () => ({
  createClient: state.create,
  listActiveTerritories: state.territories,
  checkClientDuplicate: vi.fn(),
  getClient: vi.fn(),
  updateClient: vi.fn(),
}));

const response = (status: number) => new Response(null, { status });
const input = { name: "Comercial Norte", address: "Av. Lima 1", documentType: "", documentNumber: "", phone: "", email: "", segment: "", visitFrequencyDays: null, territoryId: null, latitude: -12.04, longitude: -77.03 };
const customer = { id: "customer-1", name: "Comercial Norte", segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE" as const, location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 };

beforeEach(() => {
  state.generation = 1;
  state.identity = { id: "admin-1", roles: ["COMPANY_ADMIN"], company: { id: "company-1" } };
  state.create.mockReset();
  state.territories.mockReset().mockResolvedValue({ response: response(200), territories: [] });
});

async function openCreate(result: { current: ReturnType<typeof useClientForm> }) {
  act(() => result.current.open(null));
  await waitFor(() => expect(result.current.loading).toBe(false));
}

test("un 201 malformado conserva el formulario y no anuncia éxito", async () => {
  const saved = vi.fn();
  const { result } = renderHook(() => useClientForm(saved));
  await openCreate(result);
  state.create.mockResolvedValue({ response: response(201), client: null });

  await act(async () => { await result.current.submit(input); });

  expect(result.current.client).toBeNull();
  expect(result.current.notice).toBeNull();
  expect(result.current.error).toContain("No pudimos guardar");
  expect(saved).not.toHaveBeenCalled();
});

test("un 201 contractual limpia el formulario, anuncia éxito y recarga", async () => {
  const saved = vi.fn();
  const { result } = renderHook(() => useClientForm(saved));
  await openCreate(result);
  state.create.mockResolvedValue({ response: response(201), client: customer });

  await act(async () => { await result.current.submit(input); });

  expect(result.current.client).toBeUndefined();
  expect(result.current.notice?.title).toBe("Cliente creado");
  expect(saved).toHaveBeenCalledTimes(1);
});

test("mantiene abierto el formulario durante una renovación de la misma sesión", async () => {
  const { result } = renderHook(() => useClientForm(vi.fn()));
  await openCreate(result);

  act(() => state.listener?.());

  expect(result.current.client).toBeNull();
  expect(result.current.territories).toEqual([]);
});

test("limpia el formulario cuando cambia realmente el usuario o tenant", async () => {
  const { result } = renderHook(() => useClientForm(vi.fn()));
  await openCreate(result);
  state.identity = { id: "admin-2", roles: ["COMPANY_ADMIN"], company: { id: "company-2" } };

  act(() => state.listener?.());

  expect(result.current.client).toBeUndefined();
  expect(result.current.territories).toBeNull();
});
