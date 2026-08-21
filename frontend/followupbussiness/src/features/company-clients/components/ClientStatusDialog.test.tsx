import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ClientStatusDialog } from "./ClientStatusDialog";

afterEach(() => document.body.replaceChildren());

const client = { id: "customer-1", name: "DahuxStore", segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE" as const, location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 };

test("usa la confirmación compartida con cabecera de Clientes", () => {
  const confirm = vi.fn();
  const close = vi.fn();
  render(<ClientStatusDialog client={client} busy={false} error={null} onClose={close} onConfirm={confirm} />);
  expect(screen.getByText("Clientes")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Inactivar cliente" })).toBeTruthy();
  expect(screen.getByText(/Su estado cambiará a Inactivo/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Inactivar cliente" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(confirm).toHaveBeenCalledOnce();
  expect(close).toHaveBeenCalledOnce();
});

test("deshabilita las acciones mientras guarda", () => {
  render(<ClientStatusDialog client={client} busy error={null} onClose={() => undefined} onConfirm={() => undefined} />);
  expect(screen.getByRole("button", { name: "Guardando…" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Cancelar" })).toHaveProperty("disabled", true);
});
