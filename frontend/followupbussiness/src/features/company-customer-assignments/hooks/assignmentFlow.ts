import { MAX_BATCH_CUSTOMERS } from "../api";

export type AssignmentStep = "configure" | "clients" | "review";

export type AssignmentFlowState = Readonly<{
  step: AssignmentStep;
  sellerIds: readonly string[];
  effectiveFrom: string;
  reason: string;
  selectedCustomerIds: readonly string[];
  query: string;
  territoryId: string;
  page: number;
  reviewPage: number;
  configurationAttempted: boolean;
  announcement: string;
}>;

export type AssignmentFlowAction =
  | Readonly<{ type: "reset" }>
  | Readonly<{ type: "set-sellers"; sellerIds: readonly string[] }>
  | Readonly<{ type: "set-effective-from"; effectiveFrom: string }>
  | Readonly<{ type: "set-reason"; reason: string }>
  | Readonly<{ type: "show-configuration-errors" }>
  | Readonly<{ type: "go-to"; step: AssignmentStep }>
  | Readonly<{ type: "set-query"; query: string }>
  | Readonly<{ type: "set-territory"; territoryId: string }>
  | Readonly<{ type: "set-page"; page: number }>
  | Readonly<{ type: "set-review-page"; page: number }>
  | Readonly<{ type: "add-client"; customerId: string; customerName: string }>
  | Readonly<{ type: "remove-client"; customerId: string; customerName: string }>
  | Readonly<{ type: "remove-no-change-clients"; customerIds: readonly string[] }>
  | Readonly<{ type: "add-page"; customers: readonly Readonly<{ id: string; name: string }>[] }>
  | Readonly<{ type: "clear-clients" }>
  | Readonly<{ type: "announce"; message: string }>;

export const initialAssignmentFlowState: AssignmentFlowState = {
  step: "configure",
  sellerIds: [],
  effectiveFrom: "",
  reason: "",
  selectedCustomerIds: [],
  query: "",
  territoryId: "",
  page: 0,
  reviewPage: 0,
  configurationAttempted: false,
  announcement: "Sin clientes agregados.",
};

export function assignmentFlowReducer(
  state: AssignmentFlowState,
  action: AssignmentFlowAction,
): AssignmentFlowState {
  switch (action.type) {
    case "reset":
      return initialAssignmentFlowState;
    case "set-sellers":
      return { ...state, sellerIds: [...new Set(action.sellerIds)] };
    case "set-effective-from":
      return { ...state, effectiveFrom: action.effectiveFrom };
    case "set-reason":
      return { ...state, reason: action.reason.slice(0, 500) };
    case "show-configuration-errors":
      return { ...state, configurationAttempted: true };
    case "go-to":
      return { ...state, step: action.step, reviewPage: action.step === "review" ? 0 : state.reviewPage };
    case "set-query":
      return { ...state, query: action.query, page: 0 };
    case "set-territory":
      return { ...state, territoryId: action.territoryId, page: 0 };
    case "set-page":
      return { ...state, page: Math.max(0, action.page) };
    case "set-review-page":
      return { ...state, reviewPage: Math.max(0, action.page) };
    case "add-client": {
      if (state.selectedCustomerIds.includes(action.customerId)) {
        return { ...state, announcement: `${action.customerName} ya estaba en la asignación.` };
      }
      if (state.selectedCustomerIds.length >= MAX_BATCH_CUSTOMERS) {
        return { ...state, announcement: `No se agregó ${action.customerName}: alcanzaste el máximo de ${MAX_BATCH_CUSTOMERS} clientes.` };
      }
      const selectedCustomerIds = [...state.selectedCustomerIds, action.customerId];
      return { ...state, selectedCustomerIds, announcement: `${action.customerName} agregado. ${selectedCustomerIds.length} cliente${selectedCustomerIds.length === 1 ? "" : "s"} seleccionado${selectedCustomerIds.length === 1 ? "" : "s"}.` };
    }
    case "remove-client": {
      if (!state.selectedCustomerIds.includes(action.customerId)) return state;
      const selectedCustomerIds = state.selectedCustomerIds.filter((id) => id !== action.customerId);
      return { ...state, selectedCustomerIds, reviewPage: 0, announcement: `${action.customerName} quitado. ${selectedCustomerIds.length} cliente${selectedCustomerIds.length === 1 ? "" : "s"} seleccionado${selectedCustomerIds.length === 1 ? "" : "s"}.` };
    }
    case "remove-no-change-clients": {
      const ids = new Set(action.customerIds);
      if (ids.size === 0) return state;
      const selectedCustomerIds = state.selectedCustomerIds.filter((id) => !ids.has(id));
      const removed = state.selectedCustomerIds.length - selectedCustomerIds.length;
      if (removed === 0) return state;
      return {
        ...state,
        selectedCustomerIds,
        reviewPage: 0,
        announcement: `${removed} cliente${removed === 1 ? "" : "s"} quitado${removed === 1 ? "" : "s"} de la operación porque ya tiene${removed === 1 ? "" : "n"} exactamente los nuevos responsables.`,
      };
    }
    case "add-page": {
      const available = action.customers.filter((customer) => !state.selectedCustomerIds.includes(customer.id));
      const capacity = MAX_BATCH_CUSTOMERS - state.selectedCustomerIds.length;
      const additions = available.slice(0, capacity);
      if (additions.length === 0) {
        return {
          ...state,
          announcement: capacity === 0
            ? `No se agregaron clientes: alcanzaste el máximo de ${MAX_BATCH_CUSTOMERS}.`
            : "No se agregaron clientes: todos los clientes visibles ya estaban seleccionados.",
        };
      }
      const selectedCustomerIds = [...state.selectedCustomerIds, ...additions.map((customer) => customer.id)];
      const omitted = available.length - additions.length;
      return {
        ...state,
        selectedCustomerIds,
        announcement: `${additions.length} cliente${additions.length === 1 ? "" : "s"} de esta página agregado${additions.length === 1 ? "" : "s"}.${omitted ? ` ${omitted} no se agregaron por el límite.` : ""}`,
      };
    }
    case "clear-clients":
      return { ...state, selectedCustomerIds: [], reviewPage: 0, announcement: "Se vació la selección de clientes." };
    case "announce":
      return { ...state, announcement: action.message };
  }
}
