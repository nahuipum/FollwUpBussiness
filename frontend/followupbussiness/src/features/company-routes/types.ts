export type RouteStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type RoutePoint = Readonly<{
  /** Opaque, memory-only identifier used to submit an order. Never render or persist it. */
  routePointId?: string;
  /** Opaque, memory-only identifier used only to request a route proposal. Never render or persist it. */
  customerId?: string;
  sequence: number;
  customerName: string | null;
  /** Ephemeral map data. It is never rendered, persisted, or logged by the route UI. */
  location?: Readonly<{ latitude: number; longitude: number }>;
}>;

/** Route identifiers are retained only in in-memory feature state. */
export type Route = Readonly<{
  id: string;
  name: string | null;
  date: string;
  sellerId: string;
  status: RouteStatus;
  points: readonly RoutePoint[];
  updatedAt: string;
  version: number;
}>;

export type RoutePage = Readonly<{
  items: readonly Route[];
  page: Readonly<{ page: number; pageSize: number; totalElements: number; totalPages: number }>;
}>;

export type RouteFilters = Readonly<{
  page: number;
  pageSize: number;
  date: string;
  sellerId: string | null;
  status: RouteStatus | null;
}>;

/** Territory IDs are used only to keep route candidates within the selected seller's assignment. */
export type RouteSellerOption = Readonly<{ id: string; label: string; territoryIds: readonly string[] }>;
/** The territory ID is kept in memory solely to filter candidates; it is never rendered or submitted. */
export type RouteCustomerOption = Readonly<{ id: string; label: string; territoryId: string | null; suggested: boolean }>;
export type RouteCustomerPage = Readonly<{ items: readonly RouteCustomerOption[]; page: RoutePage["page"] }>;

/** Server-calculated road geometry. It stays in memory and is never rendered as text. */
export type RouteDirections = Readonly<{
  geometry: readonly Readonly<{ latitude: number; longitude: number }>[];
  legs: readonly Readonly<{
    distanceMeters: number;
    durationSeconds: number;
    instructions: readonly Readonly<{ text: string; distanceMeters: number; durationSeconds: number }>[];
  }>[];
  distanceMeters: number;
  durationSeconds: number;
}>;

export type RouteOptimizationVisit = Readonly<{ customerId: string; serviceDurationSeconds: number; priority: number; windows: readonly Readonly<{ start: string; end: string }>[] }>;
export type RouteOptimizationInput = Readonly<{ routeId: string; availability: Readonly<{ start: string; end: string }>; baseRouteVersion: number; visits: readonly RouteOptimizationVisit[] }>;
export type RouteProposal = Readonly<{ proposalVersion: number; baseRouteVersion: number; orderedVisits: readonly Readonly<{ customerId: string; sequence: number }>[]; unassignedVisits: readonly Readonly<{ customerId: string; reason: "OUTSIDE_SHIFT" | "TIME_WINDOW_CONFLICT" | "UNREACHABLE" | "LIMIT_EXCEEDED" }>[]; optimality: "FEASIBLE" | "OPTIMAL" | "TIME_LIMIT" }>;
export type RouteProposalValidation = Readonly<{ availability?: string; windows: Readonly<Record<string, string>> }>;
