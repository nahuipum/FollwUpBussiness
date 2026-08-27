import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRouteDetail } from "./useRouteDetail";

const state = vi.hoisted(() => ({
  getRoute: vi.fn(), listener: undefined as (() => void) | undefined, generation: 1,
  identity: { id: "admin-1", roles: ["COMPANY_ADMIN"], company: { id: "company-1" } } as { id: string; roles: string[]; company: { id: string } } | null,
}));
vi.mock("../../auth/auth", () => ({ getSessionGeneration: () => state.generation, getSessionIdentity: () => state.identity, subscribeToSession: (listener: () => void) => { state.listener = listener; return () => undefined; } }));
vi.mock("../api", () => ({ getRoute: state.getRoute }));

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "PUBLISHED" as const, points: [{ sequence: 1, customerName: "Comercial Norte" }], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
beforeEach(() => { state.generation = 1; state.identity = { id: "admin-1", roles: ["COMPANY_ADMIN"], company: { id: "company-1" } }; state.getRoute.mockReset().mockResolvedValue({ response: new Response(JSON.stringify(route), { status: 200 }), route }); });

test("cierra y cancela el detalle al cambiar de tenant, pero no durante una renovación de la misma sesión", async () => {
  const { result } = renderHook(() => useRouteDetail());
  act(() => result.current.open(route));
  await waitFor(() => expect(result.current.route).toEqual(route));
  act(() => state.listener?.());
  expect(result.current.target).toEqual(route);
  state.generation = 2; state.identity = { id: "admin-2", roles: ["COMPANY_ADMIN"], company: { id: "company-2" } };
  act(() => state.listener?.());
  expect(result.current.target).toBeNull();
  expect(result.current.route).toBeNull();
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});
