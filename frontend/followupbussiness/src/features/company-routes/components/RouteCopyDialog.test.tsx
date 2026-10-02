import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RouteCopyDialog } from "./RouteCopyDialog";

const source = { id: "route-1", name: "Ruta norte", date: "2026-09-10", sellerId: "seller-1", status: "DRAFT" as const, points: [{ sequence: 1, customerName: "Cliente" }], updatedAt: "2026-09-10T10:00:00Z", version: 1 };
const sellers = [{ id: "seller-1", label: "Ana", status: "ACTIVE" as const, territoryIds: [] }, { id: "seller-2", label: "Inactivo", status: "INACTIVE" as const, territoryIds: [] }];

test("solicita fecha y vendedor activo, conserva el nombre y bloquea el doble envío en busy", () => {
  const submit = vi.fn();
  const { rerender } = render(<RouteCopyDialog source={source} sellers={sellers} busy={false} error={null} onSubmit={submit} onClose={() => undefined} />);
  expect(screen.queryByRole("option", { name: "Inactivo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Fecha nueva" }));
  fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
  fireEvent.click(screen.getByRole("button", { name: "Crear copia" }));
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  expect(submit).toHaveBeenCalledWith({ date: todayIso, sellerId: "seller-1", name: "Ruta norte" });
  rerender(<RouteCopyDialog source={source} sellers={sellers} busy error={null} onSubmit={submit} onClose={() => undefined} />);
  expect((screen.getByRole("button", { name: "Copiando…" }) as HTMLButtonElement).disabled).toBe(true);
});
