import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { useTerritoryForm } from "./useTerritoryForm";

const state = vi.hoisted(() => ({ create: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("../../auth/auth", () => ({ subscribeToSession: () => state.unsubscribe }));
vi.mock("../api", () => ({ createTerritory: state.create, updateTerritory: vi.fn() }));

const input = { name: "Lima Centro", code: "LIM", description: null, status: "INACTIVE" as const };

function Harness() {
  const form = useTerritoryForm(() => undefined);
  useEffect(() => form.open(null), []);
  return <button type="button" onClick={() => void form.submit(input)}>Confirmar inactivación</button>;
}

afterEach(() => { state.create.mockReset(); state.unsubscribe.mockReset(); });

test("descarta un segundo envío mientras la mutación está pendiente", async () => {
  let resolveResponse: (response: Response) => void = () => undefined;
  state.create.mockReturnValue(new Promise<Response>((resolve) => { resolveResponse = resolve; }));
  render(<Harness />);
  const confirm = screen.getByRole("button", { name: "Confirmar inactivación" });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  await waitFor(() => expect(state.create).toHaveBeenCalledOnce());
  resolveResponse(new Response(null, { status: 201 }));
});
