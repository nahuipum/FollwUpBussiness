import { expect, test } from "vitest";
import { assignmentFlowReducer, initialAssignmentFlowState } from "./assignmentFlow";

test("agrega sin duplicar y conserva la selección al cambiar filtros", () => {
  const one = assignmentFlowReducer(initialAssignmentFlowState, { type: "add-client", customerId: "c-1", customerName: "Cliente Uno" });
  const duplicate = assignmentFlowReducer(one, { type: "add-client", customerId: "c-1", customerName: "Cliente Uno" });
  const filtered = assignmentFlowReducer(duplicate, { type: "set-query", query: "otro" });
  expect(filtered.selectedCustomerIds).toEqual(["c-1"]);
  expect(filtered.page).toBe(0);
  expect(duplicate.announcement).toContain("ya estaba");
});

test("agregar página solo incorpora visibles y respeta el máximo de 1000", () => {
  const almostFull = { ...initialAssignmentFlowState, selectedCustomerIds: Array.from({ length: 999 }, (_, index) => `existing-${index}`) };
  const result = assignmentFlowReducer(almostFull, { type: "add-page", customers: [{ id: "new-1", name: "Uno" }, { id: "new-2", name: "Dos" }] });
  expect(result.selectedCustomerIds).toHaveLength(1000);
  expect(result.selectedCustomerIds).toContain("new-1");
  expect(result.selectedCustomerIds).not.toContain("new-2");
  expect(result.announcement).toContain("1 no se agregaron");
});

test("rechaza el cliente 1001 y permite quitar uno sin perder el resto", () => {
  const full = { ...initialAssignmentFlowState, selectedCustomerIds: Array.from({ length: 1000 }, (_, index) => `customer-${index}`) };
  const rejected = assignmentFlowReducer(full, { type: "add-client", customerId: "customer-1000", customerName: "Cliente 1001" });
  expect(rejected.selectedCustomerIds).toHaveLength(1000);
  expect(rejected.announcement).toContain("máximo de 1000");
  const removed = assignmentFlowReducer(rejected, { type: "remove-client", customerId: "customer-0", customerName: "Cliente 1" });
  expect(removed.selectedCustomerIds).toHaveLength(999);
});

test("quita del lote los clientes que quedarían sin cambios al modificar responsables", () => {
  const selected = { ...initialAssignmentFlowState, selectedCustomerIds: ["customer-1", "customer-2"] };
  const result = assignmentFlowReducer(selected, { type: "remove-no-change-clients", customerIds: ["customer-1"] });
  expect(result.selectedCustomerIds).toEqual(["customer-2"]);
  expect(result.announcement).toContain("exactamente los nuevos responsables");
});
