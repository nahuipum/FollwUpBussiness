import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RoutePublishWorkflow } from "./RoutePublishWorkflow";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));
vi.mock("./RouteSequenceMap", () => ({ RouteSequenceMap: () => <div aria-label="Mapa del orden final" /> }));

afterEach(cleanup);

const route = { id: "route-1", name: "Norte", date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "point-1", customerId: "customer-1", sequence: 1, customerName: "Comercial Norte" }], updatedAt: "2026-08-26T11:00:00Z", version: 1 };

test("revisa datos reales y exige una confirmación separada antes de publicar", () => {
  const notify = vi.fn(); const confirm = vi.fn();
  const edit = vi.fn();
  const { rerender } = render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={null} onNotifySeller={notify} onClose={() => undefined} onEditOrder={edit} onConfirm={confirm} onReload={() => undefined} />);
  expect(screen.getByRole("heading", { name: "Revisar y publicar ruta" })).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("Orden final de visitas")).toBeTruthy();
  expect(screen.getByText("Todo listo para confirmar")).toBeTruthy();
  expect(screen.queryByText("Lista para publicar")).toBeNull();
  expect(screen.getByLabelText("Mapa del orden final")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Editar orden" }));
  expect(edit).toHaveBeenCalledOnce();
  expect(screen.getByText("Ana")).toBeTruthy(); expect(screen.getAllByText("26/08/2026")).not.toHaveLength(0); expect(screen.getByText("Comercial Norte")).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox", { name: /Notificar al vendedor/ }));
  expect(notify).toHaveBeenCalledWith(false);
  expect(confirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continuar a confirmación" }));
  const dialog = screen.getByRole("alertdialog", { name: "Confirmar publicación" });
  expect(dialog.textContent).toContain("Norte · Ana · 26/08/2026");
  fireEvent.click(screen.getByRole("button", { name: "Confirmar publicación" }));
  expect(confirm).toHaveBeenCalledOnce();
  rerender(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller busy error={null} onNotifySeller={notify} onClose={() => undefined} onEditOrder={edit} onConfirm={confirm} onReload={() => undefined} />);
  expect((screen.getByRole("button", { name: "Publicando…" }) as HTMLButtonElement).disabled).toBe(true);
});

test("un conflicto conserva la revisión y exige cargar la versión actual", () => {
  const reload = vi.fn();
  render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={{ status: 409, code: "ROUTE_VERSION_CONFLICT", correlationId: null, fieldErrors: [] }} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={() => undefined} onReload={reload} />);
  expect(screen.getByRole("alert").textContent).toContain("versión");
  expect(screen.getByRole("alert").textContent).toContain("No se publicó ningún cambio");
  fireEvent.click(screen.getByRole("button", { name: "Cargar estado actual" }));
  expect(reload).toHaveBeenCalledOnce();
});

test("distingue una planificación vencida y no ofrece una recarga inútil", () => {
  render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={{ status: 409, code: "SNAPSHOT_EXPIRED", correlationId: null, fieldErrors: [] }} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={() => undefined} onReload={() => undefined} />);
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("La planificación de la ruta venció");
  expect(alert.textContent).toContain("fecha actual o futura");
  expect(screen.queryByRole("button", { name: "Cargar estado actual" })).toBeNull();
});

test.each<readonly [422 | 500, string]>([
  [422, "no cumple las condiciones"],
  [500, "No pudimos publicar"],
])("permite reintentar el error recuperable %s desde la misma confirmación", (status, message) => {
  const confirm = vi.fn();
  const { rerender } = render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller={false} busy={false} error={null} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={confirm} onReload={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar a confirmación" }));
  rerender(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller={false} busy={false} error={{ status, correlationId: null, fieldErrors: [] }} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={confirm} onReload={() => undefined} />);
  expect(screen.getByRole("alertdialog", { name: "Confirmar publicación" }).textContent).toContain(message);
  expect((screen.getByRole("checkbox", { name: /Notificar al vendedor/ }) as HTMLInputElement).checked).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar publicación" }));
  expect(confirm).toHaveBeenCalledOnce();
});

test("identifica la ruta sin nombre con vendedor y fecha legible al confirmar", () => {
  render(<RoutePublishWorkflow route={{ ...route, name: null }} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={null} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={() => undefined} onReload={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar a confirmación" }));
  const dialog = screen.getByRole("alertdialog", { name: "Confirmar publicación" });
  expect(dialog.textContent).toContain("Ruta programada para 26/08/2026 · Ana · 26/08/2026");
});

test("no permite abrir confirmación cuando el vendedor no está activo", () => {
  render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable={false} notifySeller busy={false} error={null} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={() => undefined} onReload={() => undefined} />);
  expect((screen.getByRole("button", { name: "Continuar a confirmación" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Requiere vendedor activo")).toBeTruthy();
});

test("mantiene el mapa publicado abierto como panel hermano y a ancho de la revisión", () => {
  const { container } = render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={null} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={() => undefined} onReload={() => undefined} />);
  const layout = container.querySelector(".route-publish-layout");
  const order = layout?.querySelector(":scope > .route-publish-order");
  const map = layout?.querySelector(":scope > details.route-publish-map.route-publish-order");
  expect(order).toBeTruthy();
  expect(map).toBeTruthy();
  expect(map?.hasAttribute("open")).toBe(true);
  expect(order?.querySelector(".route-publish-map")).toBeNull();
  expect(map?.querySelector('[aria-label="Mapa del orden final"]')).toBeTruthy();
});

test.each<readonly [403 | 404 | 422 | 500, string]>([
  [403, "ya no tiene permiso"],
  [404, "ya no está disponible"],
  [422, "no cumple las condiciones"],
  [500, "No pudimos publicar"],
])("explica el error HTTP %s sin modificar el orden", (status, message) => {
  const original = route.points.map((point) => point.routePointId);
  const { container } = render(<RoutePublishWorkflow route={route} sellerLabel="Ana" sellerAvailable notifySeller busy={false} error={{ status, correlationId: null, fieldErrors: [] }} onNotifySeller={() => undefined} onClose={() => undefined} onEditOrder={() => undefined} onConfirm={() => undefined} onReload={() => undefined} />);
  expect(container.textContent).toContain(message);
  expect(route.points.map((point) => point.routePointId)).toEqual(original);
});
