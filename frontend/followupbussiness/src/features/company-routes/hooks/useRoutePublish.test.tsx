import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRoutePublish } from "./useRoutePublish";

const state = vi.hoisted(() => ({ publish: vi.fn() }));
vi.mock("../api", () => ({ publishRoute: state.publish }));
const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [], updatedAt: "2026-08-26T11:00:00Z", version: 1 };
beforeEach(() => state.publish.mockReset());

test("usa una única mutación y limpia publicación pendiente al cambiar el tenant", async () => {
  let resolve: (value: { response: Response; route: null }) => void = () => undefined;
  state.publish.mockReturnValue(new Promise((done) => { resolve = done; }));
  const saved = vi.fn(); const { result, rerender } = renderHook(({ key }) => useRoutePublish(key, saved, () => undefined), { initialProps: { key: "tenant-a" } });
  act(() => result.current.open(route));
  act(() => { void result.current.submit(); void result.current.submit(); });
  expect(state.publish).toHaveBeenCalledOnce();
  rerender({ key: "tenant-b" });
  expect(result.current.route).toBeNull(); expect(result.current.busy).toBe(false);
  await act(async () => { resolve({ response: new Response(null, { status: 500 }), route: null }); await Promise.resolve(); });
  expect(saved).not.toHaveBeenCalled();
});

test("conserva el diálogo tras el conflicto y solicita recarga", async () => {
  const conflict = vi.fn();
  state.publish.mockResolvedValue({ response: new Response(null, { status: 409 }), route: null });
  const { result } = renderHook(() => useRoutePublish("tenant-a", () => undefined, conflict));
  act(() => result.current.open(route));
  await act(async () => { await result.current.submit(); });
  await waitFor(() => expect(result.current.error?.status).toBe(409));
  expect(result.current.route).toEqual(route); expect(conflict).toHaveBeenCalledOnce();
});
