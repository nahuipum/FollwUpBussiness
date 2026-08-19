import { apiRequest } from "../../lib/api";
import { getSessionAuthorization } from "../auth/auth";
import type { Client, ClientFilterOptions, ClientFilters, ClientPage, ClientStatus } from "./types";

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
const isStatus = (value: unknown): value is ClientStatus => value === "ACTIVE" || value === "INACTIVE";

function parseClient(value: unknown): Client | null {
  if (typeof value !== "object" || value === null) return null;
  const customer = value as Record<string, unknown>;
  const location = customer.location;
  if (typeof location !== "object" || location === null) return null;
  const point = location as Record<string, unknown>;
  if (
    typeof customer.id !== "string" || typeof customer.name !== "string" || !isStatus(customer.status) ||
    !Array.isArray(customer.assignedSellerIds) || !customer.assignedSellerIds.every((id) => typeof id === "string") ||
    (customer.territoryId !== null && typeof customer.territoryId !== "string") ||
    (customer.segment !== undefined && typeof customer.segment !== "string") ||
    typeof point.latitude !== "number" || typeof point.longitude !== "number" ||
    !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) ||
    typeof customer.createdAt !== "string" || typeof customer.updatedAt !== "string" ||
    !isNonNegativeInteger(customer.version) || customer.version === 0
  ) return null;
  return {
    id: customer.id, name: customer.name, status: customer.status, territoryId: customer.territoryId,
    segment: typeof customer.segment === "string" ? customer.segment : null,
    assignedSellerIds: customer.assignedSellerIds, location: { latitude: point.latitude, longitude: point.longitude },
    createdAt: customer.createdAt, updatedAt: customer.updatedAt, version: customer.version,
  };
}

function parsePage<T>(value: unknown, parseItem: (item: unknown) => T | null): { items: readonly T[]; page: ClientPage["page"] } | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (!Array.isArray(result.items) || typeof result.page !== "object" || result.page === null) return null;
  const page = result.page as Record<string, unknown>;
  if (![page.page, page.pageSize, page.totalElements, page.totalPages].every(isNonNegativeInteger) || page.pageSize === 0) return null;
  const items = result.items.map(parseItem);
  return items.some((item) => item === null) ? null : { items: items as T[], page: page as ClientPage["page"] };
}

export async function listClients(filters: ClientFilters): Promise<{ response: Response; page: ClientPage | null }> {
  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.status) query.set("status", filters.status);
  if (filters.territoryId) query.set("territoryId", filters.territoryId);
  if (filters.sellerId) query.set("sellerId", filters.sellerId);
  if (filters.withoutVisitSince) query.set("withoutVisitSince", filters.withoutVisitSince);
  if (filters.withoutPurchaseSince) query.set("withoutPurchaseSince", filters.withoutPurchaseSince);
  const response = await apiRequest(`/customers?${query}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  return { response, page: response.status === 200 ? parsePage(await response.json().catch(() => null), parseClient) : null };
}

type Reference = Readonly<{ id: string; label: string }>;
function parseTerritory(value: unknown): Reference | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.code === "string"
    ? { id: entry.id, label: entry.name } : null;
}
function parseSeller(value: unknown): Reference | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.displayName === "string"
    ? { id: entry.id, label: entry.displayName } : null;
}
async function listReferences(path: string, parse: (item: unknown) => Reference | null): Promise<{ response: Response; items: readonly Reference[] | null }> {
  const response = await apiRequest(`${path}?page=0&pageSize=100`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  const first = response.status === 200 ? parsePage(await response.json().catch(() => null), parse) : null;
  if (!first || first.page.totalPages <= 1) return { response, items: first?.items ?? null };
  const rest = await Promise.all([...Array(first.page.totalPages - 1)].map(async (_, index) => {
    const next = await apiRequest(`${path}?page=${index + 1}&pageSize=100`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
    return { response: next, page: next.status === 200 ? parsePage(await next.json().catch(() => null), parse) : null };
  }));
  const failed = rest.find((entry) => entry.response.status !== 200 || entry.page === null);
  return failed ? { response: failed.response, items: null } : { response, items: [...first.items, ...rest.flatMap((entry) => entry.page?.items ?? [])] };
}
export async function listClientFilterOptions(): Promise<{ response: Response; options: ClientFilterOptions | null }> {
  const [territories, sellers] = await Promise.all([listReferences("/territories", parseTerritory), listReferences("/sellers", parseSeller)]);
  if (territories.response.status !== 200) return { response: territories.response, options: null };
  if (sellers.response.status !== 200) return { response: sellers.response, options: null };
  return territories.items && sellers.items ? { response: territories.response, options: { territories: territories.items, sellers: sellers.items } } : { response: territories.response, options: null };
}
