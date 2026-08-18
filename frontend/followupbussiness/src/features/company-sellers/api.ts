import { apiRequest } from "../../lib/api";
import { getSessionAuthorization } from "../auth/auth";
import type { Seller, SellerFilters, SellerPage, SellerStatus, TerritoryReference } from "./types";

function isStatus(value: unknown): value is SellerStatus { return value === "ACTIVE" || value === "INACTIVE"; }
function isNonNegativeInteger(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value >= 0; }
function parseSupervisor(value: unknown): Seller["supervisor"] | undefined {
  if (value === null) return null;
  if (typeof value !== "object" || value === null) return undefined;
  const reference = value as Record<string, unknown>;
  return typeof reference.id === "string" && typeof reference.displayName === "string" ? { id: reference.id, displayName: reference.displayName } : undefined;
}
function parseTerritories(value: unknown): readonly TerritoryReference[] | null {
  if (!Array.isArray(value)) return null;
  const territories = value.map((entry) => {
    if (typeof entry !== "object" || entry === null) return null;
    const territory = entry as Record<string, unknown>;
    return typeof territory.id === "string" && typeof territory.code === "string" && typeof territory.name === "string" ? { id: territory.id, code: territory.code, name: territory.name } : null;
  });
  return territories.some((territory) => territory === null) ? null : territories as TerritoryReference[];
}
function parseSeller(value: unknown): Seller | null {
  if (typeof value !== "object" || value === null) return null;
  const seller = value as Record<string, unknown>;
  const supervisor = parseSupervisor(seller.supervisor);
  const territories = parseTerritories(seller.territories);
  if (typeof seller.id !== "string" || typeof seller.userId !== "string" || typeof seller.displayName !== "string" || !isStatus(seller.status) || !Array.isArray(seller.territoryIds) || !seller.territoryIds.every((id) => typeof id === "string") || (seller.supervisorId !== null && typeof seller.supervisorId !== "string") || supervisor === undefined || territories === null || typeof seller.createdAt !== "string" || typeof seller.updatedAt !== "string" || !isNonNegativeInteger(seller.version) || seller.version === 0) return null;
  return { id: seller.id, userId: seller.userId, displayName: seller.displayName, email: typeof seller.email === "string" ? seller.email : null, phone: typeof seller.phone === "string" ? seller.phone : null, employeeCode: typeof seller.employeeCode === "string" ? seller.employeeCode : null, supervisorId: seller.supervisorId, territoryIds: seller.territoryIds, supervisor, territories, status: seller.status, createdAt: seller.createdAt, updatedAt: seller.updatedAt, version: seller.version };
}
function parsePage(value: unknown): SellerPage | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (!Array.isArray(result.items) || typeof result.page !== "object" || result.page === null) return null;
  const page = result.page as Record<string, unknown>;
  if (![page.page, page.pageSize, page.totalElements, page.totalPages].every(isNonNegativeInteger) || page.pageSize === 0) return null;
  const items = result.items.map(parseSeller);
  return items.some((item) => item === null) ? null : { items: items as Seller[], page: page as SellerPage["page"] };
}
export async function listSellers(filters: SellerFilters): Promise<{ response: Response; page: SellerPage | null }> {
  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.status) query.set("status", filters.status);
  if (filters.supervisorId) query.set("supervisorId", filters.supervisorId);
  if (filters.territoryId) query.set("territoryId", filters.territoryId);
  const response = await apiRequest(`/sellers?${query}`, { method: "GET", headers: getSessionAuthorization() });
  return { response, page: response.status === 200 ? parsePage(await response.json().catch(() => null)) : null };
}
