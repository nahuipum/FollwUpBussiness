import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRouteCopy } from "./useRouteCopy";

const state = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock("../api", () => ({ copyRoute: state.copy }));
const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
beforeEach(() => state.copy.mockReset());

test("evita doble solicitud y descarta el resultado si cambia la sesión o el tenant", async () => {
  let resolve: (value: { response: Response; result: null }) => void = () => undefined;
  state.copy.mockReturnValue(new Promise((done) => { resolve = done; }));
  const copied = vi.fn();
  const { result, rerender } = renderHook(({ sessionKey }) => useRouteCopy(sessionKey, copied), { initialProps: { sessionKey: "tenant-a" } });
  act(() => result.current.open(route));
  act(() => { void result.current.submit({ date: "2026-09-30", sellerId: "seller-1" }); void result.current.submit({ date: "2026-09-30", sellerId: "seller-1" }); });
  expect(state.copy).toHaveBeenCalledOnce();
  expect(state.copy.mock.calls[0]?.[2]).toEqual(expect.any(String));
  rerender({ sessionKey: "tenant-b" });
  expect(result.current.source).toBeNull();
  expect(result.current.busy).toBe(false);
  await act(async () => { resolve({ response: new Response(null, { status: 500 }), result: null }); await Promise.resolve(); });
  expect(copied).not.toHaveBeenCalled();
});

test("reutiliza la idempotencia para el mismo comando y genera otra al cambiar el destino", async () => {
  state.copy.mockResolvedValue({ response: new Response(null, { status: 422 }), result: null });
  const { result } = renderHook(() => useRouteCopy("tenant-a", () => undefined));
  act(() => result.current.open(route));
  await act(async () => { await result.current.submit({ date: "2026-09-30", sellerId: "seller-1" }); });
  await act(async () => { await result.current.submit({ date: "2026-09-30", sellerId: "seller-1" }); });
  await act(async () => { await result.current.submit({ date: "2026-10-01", sellerId: "seller-1" }); });
  expect(state.copy.mock.calls[1]?.[2]).toBe(state.copy.mock.calls[0]?.[2]);
  expect(state.copy.mock.calls[2]?.[2]).not.toBe(state.copy.mock.calls[1]?.[2]);
});
