export type RouteStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type RoutePoint = Readonly<{
  /** Opaque, memory-only identifier used to submit an order. Never render or persist it. */
  routePointId?: string;
  sequence: number;
  customerName: string | null;
  /** Ephemeral map data. It is never rendered, persisted, or logged by the route UI. */
  location?: Readonly<{ latitude: number; longitude: number }>;
}>;

/** Deliberately excludes customer identifiers from UI state. */
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

export type RouteSellerOption = Readonly<{ id: string; label: string }>;
export type RouteCustomerOption = Readonly<{ id: string; label: string; suggested: boolean }>;
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
