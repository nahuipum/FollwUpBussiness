import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useSellerInvitation } from "./useSellerInvitation";

const state = vi.hoisted(() => ({ resend: vi.fn() }));
vi.mock("../api", () => ({ resendSellerInvitation: state.resend }));

const invited = {
  id: "seller-1", userId: "user-1", displayName: "Ana", email: null,
  phone: null, employeeCode: null, supervisorId: null, territoryIds: [],
  supervisor: null, territories: [], status: "INVITED" as const,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 4,
};

beforeEach(() => state.resend.mockReset());

test("confirma el reenvío una sola vez y conserva el éxito sin afirmar entrega", async () => {
  state.resend.mockResolvedValue({ response: new Response(JSON.stringify(invited), { status: 202 }), seller: invited });
  const saved = vi.fn();
  const { result } = renderHook(() => useSellerInvitation("company-a", saved));
  act(() => result.current.open(invited));
  await act(async () => { await result.current.submit(); });
  expect(state.resend).toHaveBeenCalledWith(invited);
  await waitFor(() => expect(saved).toHaveBeenCalledWith(invited));
  expect(result.current.success).toBe(true);
});

test("mantiene el diálogo ante conflicto y lo limpia al cambiar de empresa", async () => {
  state.resend.mockResolvedValue({ response: new Response(null, { status: 409 }), seller: null });
  const { result, rerender } = renderHook(({ key }) => useSellerInvitation(key, () => undefined), { initialProps: { key: "company-a" } });
  act(() => result.current.open(invited));
  await act(async () => { await result.current.submit(); });
  expect(result.current.seller).toBe(invited);
  expect(result.current.error?.status).toBe(409);
  rerender({ key: "company-b" });
  await waitFor(() => expect(result.current.seller).toBeNull());
  expect(result.current.error).toBeNull();
});
