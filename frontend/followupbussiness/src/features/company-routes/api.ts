import { apiRequest } from "../../lib/api";
import { getSessionAuthorization, getSessionMutationAuthorization } from "../auth/auth";
import type { Route, RouteCustomerOption, RouteCustomerPage, RouteDirections, RouteFilters, RouteOptimizationInput, RoutePage, RoutePoint, RouteProposal, RouteSellerOption, RouteStatus } from "./types";

const statuses = new Set<RouteStatus>(["DRAFT", "PUBLISHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const nonNegativeInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

function parsePoint(value: unknown): RoutePoint | null {
  if (typeof value !== "object" || value === null) return null;
  const point = value as Record<string, unknown>;
  const location = point.location;
  if (typeof point.id !== "string" || typeof point.customerId !== "string" || !nonNegativeInteger(point.sequence) || point.sequence < 1 || typeof point.status !== "string") return null;
  if (point.customerName !== undefined && typeof point.customerName !== "string") return null;
  const coordinates = typeof location === "object" && location !== null ? location as Record<string, unknown> : null;
  const validLocation = coordinates && typeof coordinates.latitude === "number" && Number.isFinite(coordinates.latitude) && typeof coordinates.longitude === "number" && Number.isFinite(coordinates.longitude)
    ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
    : undefined;
  return { routePointId: point.id, customerId: point.customerId, sequence: point.sequence, customerName: point.customerName ?? null, ...(validLocation ? { location: validLocation } : {}) };
}

function parseRoute(value: unknown): Route | null {
  if (typeof value !== "object" || value === null) return null;
  const route = value as Record<string, unknown>;
  if (typeof route.id !== "string" || !validDate(route.date) || typeof route.sellerId !== "string" || !statuses.has(route.status as RouteStatus) || !Array.isArray(route.points) || typeof route.updatedAt !== "string" || !nonNegativeInteger(route.version) || route.version < 1) return null;
  const points = route.points.map(parsePoint);
  if (points.some((point) => point === null)) return null;
  return { id: route.id, name: typeof route.name === "string" ? route.name : null, date: route.date, sellerId: route.sellerId, status: route.status as RouteStatus, points: points as RoutePoint[], updatedAt: route.updatedAt, version: route.version };
}

function parseDirections(value: unknown): RouteDirections | null {
  if (typeof value !== "object" || value === null) return null;
  const directions = value as Record<string, unknown>;
  const point = (entry: unknown): { latitude: number; longitude: number } | null => {
    if (typeof entry !== "object" || entry === null) return null;
    const value = entry as Record<string, unknown>;
    return typeof value.latitude === "number" && Number.isFinite(value.latitude) && typeof value.longitude === "number" && Number.isFinite(value.longitude) ? { latitude: value.latitude, longitude: value.longitude } : null;
  };
  const instruction = (entry: unknown): { text: string; distanceMeters: number; durationSeconds: number } | null => {
    if (typeof entry !== "object" || entry === null) return null;
    const value = entry as Record<string, unknown>;
    return typeof value.text === "string" && value.text.length <= 500 && nonNegativeInteger(value.distanceMeters) && nonNegativeInteger(value.durationSeconds) ? { text: value.text, distanceMeters: value.distanceMeters, durationSeconds: value.durationSeconds } : null;
  };
  const leg = (entry: unknown): RouteDirections["legs"][number] | null => {
    if (typeof entry !== "object" || entry === null) return null;
    const value = entry as Record<string, unknown>;
    if (!nonNegativeInteger(value.distanceMeters) || !nonNegativeInteger(value.durationSeconds) || !Array.isArray(value.instructions)) return null;
    const instructions = value.instructions.map(instruction);
    return instructions.some((item) => item === null) ? null : { distanceMeters: value.distanceMeters, durationSeconds: value.durationSeconds, instructions: instructions as RouteDirections["legs"][number]["instructions"] };
  };
  if (!Array.isArray(directions.geometry) || !Array.isArray(directions.legs) || !nonNegativeInteger(directions.distanceMeters) || !nonNegativeInteger(directions.durationSeconds)) return null;
  const geometry = directions.geometry.map(point); const legs = directions.legs.map(leg);
  return geometry.some((item) => item === null) || legs.some((item) => item === null) ? null : { geometry: geometry as RouteDirections["geometry"], legs: legs as RouteDirections["legs"], distanceMeters: directions.distanceMeters, durationSeconds: directions.durationSeconds };
}

function parsePage(value: unknown): RoutePage | null {
  if (typeof value !== "object" || value === null) return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items) || typeof body.page !== "object" || body.page === null) return null;
  const page = body.page as Record<string, unknown>;
  if (![page.page, page.pageSize, page.totalElements, page.totalPages].every(nonNegativeInteger) || page.pageSize === 0) return null;
  const items = body.items.map(parseRoute);
  return items.some((item) => item === null) ? null : { items: items as Route[], page: page as RoutePage["page"] };
}

export async function listRoutes(filters: RouteFilters): Promise<{ response: Response; page: RoutePage | null }> {
  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.date) query.set("date", filters.date);
  if (filters.sellerId) query.set("sellerId", filters.sellerId);
  if (filters.status) query.set("status", filters.status);
  const response = await apiRequest(`/routes?${query}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  return { response, page: response.status === 200 ? parsePage(await response.json().catch(() => null)) : null };
}

export async function getRoute(routeId: string): Promise<{ response: Response; route: Route | null }> {
  const response = await apiRequest(`/routes/${encodeURIComponent(routeId)}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  return { response, route: response.status === 200 ? parseRoute(await response.json().catch(() => null)) : null };
}

export async function getRouteDirections(routeId: string, signal?: AbortSignal): Promise<{ response: Response; directions: RouteDirections | null }> {
  const response = await apiRequest(`/routes/${encodeURIComponent(routeId)}/directions`, { method: "GET", headers: getSessionAuthorization(), ...(signal ? { signal } : {}) }, { publishErrors: false });
  return { response, directions: response.status === 200 ? parseDirections(await response.json().catch(() => null)) : null };
}

/** Calculates a transient road preview. It never persists the local ordering. */
export async function previewRouteDirections(routeId: string, baseRouteVersion: number, routePointIds: readonly string[], signal?: AbortSignal): Promise<{ response: Response; directions: RouteDirections | null }> {
  if (routePointIds.length === 0 || routePointIds.some((id) => id.length === 0)) throw new Error("Route points lack opaque IDs");
  const response = await apiRequest(`/routes/${encodeURIComponent(routeId)}/directions/preview`, {
    method: "POST",
    headers: mutationHeaders(),
    ...(signal ? { signal } : {}),
    body: JSON.stringify({ baseRouteVersion, routePointIds }),
  }, { publishErrors: false });
  return { response, directions: response.status === 200 ? parseDirections(await response.json().catch(() => null)) : null };
}

function parseCustomerPage(value: unknown, suggested: boolean): RouteCustomerPage | null {
  if (typeof value !== "object" || value === null) return null;
  const body = value as Record<string, unknown>; const page = body.page;
  if (!Array.isArray(body.items) || typeof page !== "object" || page === null) return null;
  const info = page as Record<string, unknown>;
  if (![info.page, info.pageSize, info.totalElements, info.totalPages].every(nonNegativeInteger)) return null;
  const items = body.items.map((entry): RouteCustomerOption | null => {
    const candidate = suggested && typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>).customer : entry;
    if (typeof candidate !== "object" || candidate === null) return null;
    const customer = candidate as Record<string, unknown>;
    const territoryId = customer.territoryId;
    return typeof customer.id === "string" && typeof customer.name === "string" && (typeof territoryId === "string" || territoryId === null || territoryId === undefined)
      ? { id: customer.id, label: customer.name, territoryId: typeof territoryId === "string" ? territoryId : null, suggested }
      : null;
  });
  return items.some((item) => item === null) ? null : { items: items as RouteCustomerOption[], page: info as RoutePage["page"] };
}

export async function listRouteCustomers(sellerId: string, page: number): Promise<{ response: Response; page: RouteCustomerPage | null }> {
  const response = await apiRequest(`/customers?${new URLSearchParams({ sellerId, page: String(page), pageSize: "100" })}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  return { response, page: response.status === 200 ? parseCustomerPage(await response.json().catch(() => null), false) : null };
}

export async function listSuggestedRouteCustomers(sellerId: string, date: string, page: number): Promise<{ response: Response; page: RouteCustomerPage | null }> {
  const response = await apiRequest(`/routes/suggested-customers?${new URLSearchParams({ sellerId, date, page: String(page), pageSize: "100" })}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  return { response, page: response.status === 200 ? parseCustomerPage(await response.json().catch(() => null), true) : null };
}

const mutationHeaders = (extra: HeadersInit = {}): HeadersInit => ({ "Content-Type": "application/json", ...getSessionMutationAuthorization(), ...extra });
export async function createRoute(input: { date: string; sellerId: string; customerIds: readonly string[] }, idempotencyKey: string): Promise<{ response: Response; route: Route | null }> {
  const response = await apiRequest("/routes", { method: "POST", headers: mutationHeaders({ "Idempotency-Key": idempotencyKey }), body: JSON.stringify(input) }, { publishErrors: false });
  return { response, route: response.status === 201 ? parseRoute(await response.json().catch(() => null)) : null };
}
export async function reorderRoutePoints(route: Route, points: readonly RoutePoint[], proposalVersion?: number): Promise<{ response: Response; route: Route | null }> {
  const routePointIds = points.map((point) => point.routePointId);
  if (routePointIds.some((id) => !id)) throw new Error("Route points lack opaque IDs");
  const response = await apiRequest(`/routes/${encodeURIComponent(route.id)}/points/order`, { method: "PUT", headers: mutationHeaders({ "If-Match": `"${route.version}"` }), body: JSON.stringify({ routePointIds, ...(proposalVersion === undefined ? {} : { proposalVersion }) }) }, { publishErrors: false });
  return { response, route: response.status === 200 ? parseRoute(await response.json().catch(() => null)) : null };
}

function parseSeller(value: unknown): RouteSellerOption | null {
  if (typeof value !== "object" || value === null) return null;
  const seller = value as Record<string, unknown>;
  const territoryIds = seller.territoryIds;
  return typeof seller.id === "string" && typeof seller.displayName === "string" && Array.isArray(territoryIds) && territoryIds.every((id) => typeof id === "string")
    ? { id: seller.id, label: seller.displayName, territoryIds }
    : null;
}

function parseProposal(value: unknown): RouteProposal | null {
  if (typeof value !== "object" || value === null) return null;
  const proposal = value as Record<string, unknown>;
  const optimality = proposal.optimality;
  if (typeof proposal.routeId !== "string" || !nonNegativeInteger(proposal.proposalVersion) || proposal.proposalVersion < 1 || !nonNegativeInteger(proposal.baseRouteVersion) || proposal.baseRouteVersion < 1 || proposal.published !== false || !["FEASIBLE", "OPTIMAL", "TIME_LIMIT"].includes(String(optimality)) || !Array.isArray(proposal.orderedVisits) || !Array.isArray(proposal.unassignedVisits)) return null;
  const orderedVisits = proposal.orderedVisits.map((entry): { customerId: string; sequence: number } | null => typeof entry === "object" && entry !== null && typeof (entry as Record<string, unknown>).customerId === "string" && nonNegativeInteger((entry as Record<string, unknown>).sequence) && Number((entry as Record<string, unknown>).sequence) > 0 ? { customerId: (entry as Record<string, unknown>).customerId as string, sequence: (entry as Record<string, unknown>).sequence as number } : null);
  const unassignedVisits = proposal.unassignedVisits.map((entry): RouteProposal["unassignedVisits"][number] | null => { const item = entry as Record<string, unknown>; return item && typeof item.customerId === "string" && ["OUTSIDE_SHIFT", "TIME_WINDOW_CONFLICT", "UNREACHABLE", "LIMIT_EXCEEDED"].includes(String(item.reason)) ? { customerId: item.customerId, reason: item.reason as RouteProposal["unassignedVisits"][number]["reason"] } : null; });
  return orderedVisits.some((entry) => entry === null) || unassignedVisits.some((entry) => entry === null) ? null : { proposalVersion: proposal.proposalVersion, baseRouteVersion: proposal.baseRouteVersion, orderedVisits: orderedVisits as { customerId: string; sequence: number }[], unassignedVisits: unassignedVisits as RouteProposal["unassignedVisits"], optimality: optimality as RouteProposal["optimality"] };
}

export async function optimizeRoute(input: RouteOptimizationInput): Promise<{ response: Response; proposal: RouteProposal | null }> {
  const response = await apiRequest("/routes/optimize", { method: "POST", headers: mutationHeaders(), body: JSON.stringify(input) }, { publishErrors: false });
  return { response, proposal: response.status === 200 ? parseProposal(await response.json().catch(() => null)) : null };
}

export async function listRouteSellerOptions(): Promise<{ response: Response; sellers: readonly RouteSellerOption[] | null }> {
  return listSellerPages();
}

async function listSellerPages(): Promise<{ response: Response; sellers: readonly RouteSellerOption[] | null }> {
  const read = async (page: number): Promise<{ response: Response; items: readonly RouteSellerOption[] | null; totalPages: number }> => {
    const response = await apiRequest(`/sellers?page=${page}&pageSize=100`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
    const body: unknown = response.status === 200 ? await response.json().catch(() => null) : null;
    if (typeof body !== "object" || body === null) return { response, items: null, totalPages: 0 };
    const value = body as Record<string, unknown>;
    const info = value.page as Record<string, unknown> | null;
    if (!Array.isArray(value.items) || !info || !nonNegativeInteger(info.totalPages)) return { response, items: null, totalPages: 0 };
    const items = value.items.map(parseSeller);
    return items.some((item) => item === null) ? { response, items: null, totalPages: 0 } : { response, items: items as RouteSellerOption[], totalPages: info.totalPages };
  };
  const first = await read(0);
  if (!first.items) return { response: first.response, sellers: null };
  const rest = await Promise.all([...Array(Math.max(0, first.totalPages - 1))].map((_, index) => read(index + 1)));
  const failed = rest.find((entry) => !entry.items);
  return failed ? { response: failed.response, sellers: null } : { response: first.response, sellers: [...first.items, ...rest.flatMap((entry) => entry.items ?? [])] };
}
