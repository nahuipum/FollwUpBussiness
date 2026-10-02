import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { RoutePlanningWorkflow } from "./RoutePlanningWorkflow";

vi.mock("../hooks/useRouteDirections", () => ({ useRouteDirections: () => ({ directions: null, loading: false, error: null, stale: false, retry: vi.fn() }) }));
vi.mock("./RouteSequenceMap", () => ({ RouteSequenceMap: () => <div aria-label="Mapa de la ruta" /> }));

const base = { mode: "manual" as const, sellers: [{ id: "seller-1", label: "Ana", status: "ACTIVE" as const, territoryIds: ["territory-1"] }], date: "2026-08-26", sellerId: "seller-1", customers: [{ id: "customer-1", label: "Comercial Norte", territoryId: "territory-1", suggested: false, location: { latitude: -12.04, longitude: -77.03 } }], selected: ["customer-1"], serviceDurations: { "customer-1": "1800" }, hasInvalidDurations: false, loadingCustomers: false, moreCustomers: false, suggestionError: null, saving: false, error: null, conflict: false, availabilityStart: "08:00", availabilityEnd: "17:00", planningWindowLoading: false, planningWindowError: null, proposalVisits: [{ customerId: "customer-1", included: true, serviceDurationMinutes: "30", priority: "2", windowStart: "", windowEnd: "" }], proposalValidation: { windows: {} }, onDate: vi.fn(), onSeller: vi.fn(), onSelected: vi.fn(), onServiceDuration: vi.fn(), onProposalVisit: vi.fn(), onSubmit: vi.fn(), onGenerateAutomatic: vi.fn(), onLoadMore: vi.fn(), onRetrySuggestions: vi.fn(), onRetryCustomers: vi.fn(), onRetryPlanningWindow: vi.fn(), onClose: vi.fn(), onChangeMode: vi.fn() };
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function goToCustomers() { fireEvent.click(screen.getByRole("button", { name: "Continuar a clientes" })); }
function goToOrder() { goToCustomers(); fireEvent.click(screen.getByRole("button", { name: "Continuar a orden y mapa" })); }

test("crea manualmente sólo después de revisar clientes y orden", () => {
  render(<RoutePlanningWorkflow {...base} />);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("heading", { name: "Crear ruta manual" })).toBeTruthy();
  expect(screen.getByText("Fecha operativa")).toBeTruthy();
  goToOrder();
  expect(screen.getByText("Secuencia actual")).toBeTruthy();
  expect(screen.queryByText("customer-1")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Revisar borrador" }));
  expect(screen.getByRole("region", { name: "Revisión del borrador manual" })).toBeTruthy();
  expect(screen.getByText("Secuencia a guardar")).toBeTruthy();
  expect(screen.queryByText("Clientes disponibles")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Guardar como borrador" }));
  expect(base.onSubmit).toHaveBeenCalledOnce();
});

test("exige una duración positiva antes de habilitar el orden", () => {
  render(<RoutePlanningWorkflow {...base} serviceDurations={{ "customer-1": "" }} hasInvalidDurations />);
  goToCustomers();
  expect(screen.getByLabelText("Duración (segundos)").getAttribute("aria-invalid")).toBe("true");
  expect((screen.getByRole("button", { name: "Continuar a orden y mapa" }) as HTMLButtonElement).disabled).toBe(true);
});

test("aplica el límite manual de 50 y permite reintentar la cartera", () => {
  render(<RoutePlanningWorkflow {...base} selected={Array.from({ length: 50 }, (_, index) => `customer-${index}`)} error={{ status: 500, correlationId: null, fieldErrors: [] }} />);
  goToCustomers();
  expect(screen.getByText("50 de 50 visitas")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar cartera" }));
  expect(base.onRetryCustomers).toHaveBeenCalledOnce();
});

test("deshabilita un cliente adicional al alcanzar el límite", () => {
  const customers = Array.from({ length: 51 }, (_, index) => ({ id: `customer-${index}`, label: `Cliente ${index}`, territoryId: "territory-1", suggested: false }));
  const selected = customers.slice(0, 50).map((customer) => customer.id);
  render(<RoutePlanningWorkflow {...base} customers={customers} selected={selected} serviceDurations={Object.fromEntries(selected.map((id) => [id, "60"]))} />);
  goToCustomers();
  expect((screen.getByRole("button", { name: "Agregar" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("50 de 50 visitas")).toBeTruthy();
});

test("el fallo de sugerencias no oculta la cartera", () => {
  render(<RoutePlanningWorkflow {...base} suggestionError={{ status: 500, correlationId: null, fieldErrors: [] }} />);
  goToCustomers();
  expect(screen.getAllByText("Comercial Norte").length).toBeGreaterThan(0);
  expect(screen.getByText(/La cartera sigue disponible/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar sugerencias" }));
  expect(base.onRetrySuggestions).toHaveBeenCalledOnce();
});

test("el flujo automático mantiene cinco pasos y no permite ordenar antes de optimizar", () => {
  render(<RoutePlanningWorkflow {...base} mode="automatic" />);
  expect(screen.getAllByText("Datos base").length).toBeGreaterThan(0);
  expect(screen.getByText("Clientes", { selector: ".route-stepper span" })).toBeTruthy();
  expect(screen.getByText("Restricciones", { selector: ".route-stepper span" })).toBeTruthy();
  expect(screen.getByText("Generar propuesta", { selector: ".route-stepper span" })).toBeTruthy();
  expect(screen.getByText("Revisar y guardar", { selector: ".route-stepper span" })).toBeTruthy();
  goToCustomers();
  expect(screen.getByText("1 de 9 candidatos")).toBeTruthy();
  expect((screen.getByLabelText("Duración estimada de Comercial Norte (minutos)") as HTMLInputElement).type).toBe("number");
  expect(screen.queryByRole("button", { name: /Subir/ })).toBeNull();
  expect(screen.queryByText("Inicio", { exact: true })).toBeNull();
  expect(screen.queryByText("Final", { exact: true })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Continuar a restricciones" }));
  expect(screen.getByRole("heading", { name: "Jornada configurada" })).toBeTruthy();
  expect(screen.queryByText("Inicio de jornada")).toBeNull();
  expect(screen.getByRole("heading", { name: "Comercial Norte" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /^Generar propuesta$/ }));
  expect(base.onGenerateAutomatic).toHaveBeenCalledOnce();
  expect(base.onSubmit).not.toHaveBeenCalled();
});

test("cambia a orden manual conservando la planificación actual", () => {
  function StatefulPlanning() {
    const [mode, setMode] = useState<"manual" | "automatic">("automatic");
    return <RoutePlanningWorkflow {...base} mode={mode} onChangeMode={() => setMode("manual")} />;
  }
  render(<StatefulPlanning />);
  fireEvent.click(screen.getByRole("button", { name: "Ordenar manualmente" }));
  expect(screen.getByRole("heading", { name: "Crear ruta manual" })).toBeTruthy();
  expect(screen.getByText("Secuencia actual")).toBeTruthy();
  expect(screen.getByText("Comercial Norte")).toBeTruthy();
});
