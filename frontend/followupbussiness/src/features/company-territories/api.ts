import { apiRequest } from "../../lib/api";
import { getSessionAuthorization, getSessionMutationAuthorization } from "../auth/auth";
import type { Territory, TerritoryFilters, TerritoryFormInput, TerritoryPage, TerritoryStatus } from "./types";

const isStatus = (value: unknown): value is TerritoryStatus => value === "ACTIVE" || value === "INACTIVE";
const isNonNegativeInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

function parseTerritory(value: unknown): Territory | null {
  if (typeof value !== "object" || value === null) return null;
  const territory = value as Record<string, unknown>;
  if (typeof territory.id !== "string" || typeof territory.name !== "string" ||
    (typeof territory.code !== "string" && territory.code !== null) ||
    (typeof territory.description !== "string" && territory.description !== null) ||
    !isStatus(territory.status) || !isNonNegativeInteger(territory.assignedSellerCount) ||
    typeof territory.createdAt !== "string" || typeof territory.updatedAt !== "string" ||
    !isNonNegativeInteger(territory.version) || territory.version === 0) return null;
  return { id: territory.id, name: territory.name, code: territory.code ?? "", description: territory.description ?? null,
    status: territory.status, assignedSellerCount: territory.assignedSellerCount, createdAt: territory.createdAt,
    updatedAt: territory.updatedAt, version: territory.version };
}

function parsePage(value: unknown): TerritoryPage | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (!Array.isArray(result.items) || typeof result.page !== "object" || result.page === null) return null;
  const page = result.page as Record<string, unknown>;
  if (![page.page, page.pageSize, page.totalElements, page.totalPages].every(isNonNegativeInteger) || page.pageSize === 0) return null;
  const items = result.items.map(parseTerritory);
  return items.some((item) => item === null) ? null : { items: items as Territory[], page: page as TerritoryPage["page"] };
}

export async function listTerritories(filters: TerritoryFilters): Promise<{ response: Response; page: TerritoryPage | null }> {
  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.status) query.set("status", filters.status);
  const response = await apiRequest(`/territories?${query}`, { method: "GET", headers: getSessionAuthorization() });
  return { response, page: response.status === 200 ? parsePage(await response.json().catch(() => null)) : null };
}

function mutationHeaders(version?: number): HeadersInit {
  return { "Content-Type": "application/json", ...getSessionMutationAuthorization(), ...(version === undefined ? {} : { "If-Match": String(version) }) };
}
export function createTerritory(input: TerritoryFormInput) {
  const body = { name: input.name, ...(input.code ? { code: input.code } : {}), ...(input.description ? { description: input.description } : {}) };
  return apiRequest("/territories", { method: "POST", headers: mutationHeaders(), body: JSON.stringify(body) });
}
export function updateTerritory(territory: Territory, input: TerritoryFormInput) {
  const body = { name: input.name, ...(input.code ? { code: input.code } : {}), ...(input.description ? { description: input.description } : {}), status: input.status };
  return apiRequest(`/territories/${encodeURIComponent(territory.id)}`, { method: "PATCH", headers: mutationHeaders(territory.version), body: JSON.stringify(body) });
}
