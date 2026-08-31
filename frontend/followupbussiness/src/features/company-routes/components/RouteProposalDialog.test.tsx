import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RouteProposalDialog } from "./RouteProposalDialog";

const route = { id: "route-1", name: null, date: "2026-08-26", sellerId: "seller-1", status: "DRAFT" as const, points: [{ routePointId: "opaque-1", customerId: "customer-1", sequence: 1, customerName: "Norte" }], updatedAt: "2026-08-26T12:00:00Z", version: 1 };
const visit = { customerId: "customer-1", included: true, serviceDurationMinutes: "30", priority: "1", windowStart: "", windowEnd: "" };
const props = { route, availabilityStart: "08:00", availabilityEnd: "17:00", visits: [visit], proposal: null, validation: { windows: {} }, saving: false, error: null, conflict: false, onAvailabilityStart: vi.fn(), onAvailabilityEnd: vi.fn(), onVisit: vi.fn(), onOptimize: vi.fn(), onClose: vi.fn() };

afterEach(cleanup);

test("mantiene el formulario de propuesta sin selector de territorio y habilita la acción con datos válidos", () => {
  const optimize = vi.fn();
  render(<RouteProposalDialog {...props} onOptimize={optimize} />);
  expect(screen.getByRole("heading", { name: "Generar propuesta" })).toBeTruthy();
  expect(document.querySelector("form.route-proposal-dialog__form")).toBeTruthy();
  expect(screen.queryByText("Territorio autorizado")).toBeNull();
  const button = screen.getByRole("button", { name: "Generar propuesta" });
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.click(button);
  expect(optimize).toHaveBeenCalledOnce();
  expect(screen.queryByText("opaque-1")).toBeNull();
});

test("inicia sin visitas y no crea tarjetas con treinta candidatas", () => {
  const points = Array.from({ length: 30 }, (_, index) => ({ routePointId: `point-${index}`, customerId: `customer-${index}`, sequence: index + 1, customerName: `Cliente ${index + 1}` }));
  const visits = points.map((point) => ({ customerId: point.customerId, included: false, serviceDurationMinutes: "", priority: "", windowStart: "", windowEnd: "" }));
  render(<RouteProposalDialog {...props} route={{ ...route, points }} availabilityStart="" availabilityEnd="" visits={visits} />);
  expect(screen.getByText("0 visitas seleccionadas (máximo 9 por propuesta).")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Cliente 30" })).toBeNull();
  expect(screen.queryByText("Jornada de trabajo")).toBeNull();
});

test("explica territorios múltiples sin revelar identificadores y conserva un 403 genérico", () => {
  const { rerender } = render(<RouteProposalDialog {...props} error={{ status: 422, code: "MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED", correlationId: null, fieldErrors: [] }} />);
  expect(screen.getByText("Selecciona visitas de un solo territorio y vuelve a intentarlo.")).toBeTruthy();
  expect(screen.queryByText(/territory-1|opaque-1/i)).toBeNull();
  rerender(<RouteProposalDialog {...props} error={{ status: 403, correlationId: null, fieldErrors: [] }} />);
  expect(screen.getByText("No tienes permiso para generar esta propuesta")).toBeTruthy();
  expect(screen.getByText("Inténtalo nuevamente.")).toBeTruthy();
});

test("explica el territorio no asignado al vendedor sin revelar identificadores", () => {
  render(<RouteProposalDialog {...props} error={{ status: 422, code: "VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER", correlationId: null, fieldErrors: [] }} />);
  expect(screen.getByText("Las visitas deben pertenecer a un territorio asignado al vendedor de la ruta.")).toBeTruthy();
  expect(screen.queryByText(/territory-1|opaque-1/i)).toBeNull();
});
