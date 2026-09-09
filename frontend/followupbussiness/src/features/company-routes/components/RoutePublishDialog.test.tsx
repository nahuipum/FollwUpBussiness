import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RoutePublishDialog } from "./RoutePublishDialog";

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [], updatedAt: "2026-08-26T11:00:00Z", version: 1 };

test("confirma datos mínimos, permite omitir la notificación y bloquea doble envío", () => {
  const notify = vi.fn(); const confirm = vi.fn();
  const { rerender } = render(<RoutePublishDialog route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={null} onNotifySeller={notify} onClose={() => undefined} onConfirm={confirm} onReload={() => undefined} />);
  expect(screen.getByRole("dialog", { name: "Publicar ruta" })).toBeTruthy();
  expect(screen.getByText("Ana")).toBeTruthy(); expect(screen.getByText("2026-08-26")).toBeTruthy(); expect(screen.getByText("Activo")).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox", { name: "Notificar al vendedor después de publicar" }));
  expect(notify).toHaveBeenCalledWith(false);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar publicación" })); expect(confirm).toHaveBeenCalledOnce();
  rerender(<RoutePublishDialog route={route} sellerLabel="Ana" sellerAvailable notifySeller busy error={null} onNotifySeller={notify} onClose={() => undefined} onConfirm={confirm} onReload={() => undefined} />);
  expect((screen.getByRole("button", { name: "Publicando…" }) as HTMLButtonElement).disabled).toBe(true);
});

test("explica el bloqueo de publicación por snapshot sin atribuir una concurrencia falsa", () => {
  const reload = vi.fn();
  render(<RoutePublishDialog route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={{ status: 409, correlationId: null, fieldErrors: [] }} onNotifySeller={() => undefined} onClose={() => undefined} onConfirm={() => undefined} onReload={reload} />);
  expect(screen.getByRole("alert").textContent).toContain("snapshot válido");
  expect(screen.getByRole("alert").textContent).not.toContain("cambió mientras");
  fireEvent.click(screen.getByRole("button", { name: "Recargar ruta" })); expect(reload).toHaveBeenCalledOnce();
});
