import { apiRequest } from "../../lib/api";
import { getSessionAuthorization, getSessionMutationAuthorization } from "../auth/auth";
import type { Client, ClientDuplicateCheckInput, ClientDuplicateCheckResult, ClientFilterOptions, ClientFilters, ClientFormInput, ClientFormTarget, ClientPage, ClientStatus, TerritoryOption } from "./types";

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
const isStatus = (value: unknown): value is ClientStatus => value === "ACTIVE" || value === "INACTIVE";
const isOptionalNullableString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === "string";

function parseClient(value: unknown): Client | null {
  if (typeof value !== "object" || value === null) return null;
  const customer = value as Record<string, unknown>;
  const location = customer.location;
  if (typeof location !== "object" || location === null) return null;
  const point = location as Record<string, unknown>;
  const territoryId = customer.territoryId;
  const segment = customer.segment;
  if (
    typeof customer.id !== "string" || typeof customer.name !== "string" || !isStatus(customer.status) ||
    !Array.isArray(customer.assignedSellerIds) || !customer.assignedSellerIds.every((id) => typeof id === "string") ||
    !isOptionalNullableString(territoryId) || !isOptionalNullableString(segment) ||
    typeof point.latitude !== "number" || typeof point.longitude !== "number" ||
    !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) ||
    typeof customer.createdAt !== "string" || typeof customer.updatedAt !== "string" ||
    !isNonNegativeInteger(customer.version) || customer.version === 0
  ) return null;
  return {
    id: customer.id, name: customer.name, status: customer.status, territoryId: territoryId ?? null,
    segment: segment ?? null,
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
type TerritoryReference = Reference & Readonly<{ code: string }>;
function parseTerritory(value: unknown): TerritoryReference | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.code === "string"
    ? { id: entry.id, label: entry.name, code: entry.code } : null;
}
function parseSeller(value: unknown): Reference | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.displayName === "string"
    ? { id: entry.id, label: entry.displayName } : null;
}
async function listReferences<T extends Reference>(path: string, parse: (item: unknown) => T | null): Promise<{ response: Response; items: readonly T[] | null }> {
  const separator = path.includes("?") ? "&" : "?";
  const pagePath = (page: number) => `${path}${separator}page=${page}&pageSize=100`;
  const response = await apiRequest(pagePath(0), { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  const first = response.status === 200 ? parsePage(await response.json().catch(() => null), parse) : null;
  if (!first || first.page.totalPages <= 1) return { response, items: first?.items ?? null };
  const rest = await Promise.all([...Array(first.page.totalPages - 1)].map(async (_, index) => {
    const next = await apiRequest(pagePath(index + 1), { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
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

function mutationHeaders(version?: number): HeadersInit { return { "Content-Type": "application/json", ...getSessionMutationAuthorization(), ...(version === undefined ? {} : { "If-Match": String(version) }) }; }
const optionalString = (value: string) => value.trim() || undefined;
function formBody(input: ClientFormInput) {
  return {
    name: input.name.trim(),
    address: input.address.trim(),
    ...(optionalString(input.documentType) ? { documentType: optionalString(input.documentType) } : {}),
    ...(optionalString(input.documentNumber) ? { documentNumber: optionalString(input.documentNumber) } : {}),
    ...(optionalString(input.phone) ? { phone: optionalString(input.phone) } : {}),
    ...(optionalString(input.email) ? { email: optionalString(input.email) } : {}),
    ...(optionalString(input.segment) ? { segment: optionalString(input.segment) } : {}),
    ...(input.visitFrequencyDays !== null && Number.isInteger(input.visitFrequencyDays) && input.visitFrequencyDays >= 1 && input.visitFrequencyDays <= 365 ? { visitFrequencyDays: input.visitFrequencyDays } : {}),
    ...(input.territoryId ? { territoryId: input.territoryId } : {}),
    location: { latitude: input.latitude, longitude: input.longitude },
  };
}
async function mutateClient(path: string, method: "POST" | "PATCH", input: ClientFormInput, version?: number): Promise<{ response: Response; client: Client | null }> {
  const response = await apiRequest(path, { method, headers: mutationHeaders(version), body: JSON.stringify(formBody(input)) }, { publishErrors: false });
  return { response, client: (response.status === 200 || response.status === 201) ? parseClient(await response.json().catch(() => null)) : null };
}
export function createClient(input: ClientFormInput) { return mutateClient("/customers", "POST", input); }
export function updateClient(client: Client, input: ClientFormInput) { return mutateClient(`/customers/${encodeURIComponent(client.id)}`, "PATCH", input, client.version); }
export async function changeClientStatus(client: Client, status: ClientStatus): Promise<{ response: Response; client: Client | null }> {
  const response = await apiRequest(`/customers/${encodeURIComponent(client.id)}`, {
    method: "PATCH",
    headers: mutationHeaders(client.version),
    body: JSON.stringify({ status }),
  }, { publishErrors: false });
  return { response, client: response.status === 200 ? parseClient(await response.json().catch(() => null)) : null };
}
export async function getClient(clientId: string): Promise<{ response: Response; client: ClientFormTarget | null }> {
  const response = await apiRequest(`/customers/${encodeURIComponent(clientId)}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  const body: unknown = response.status === 200 ? await response.json().catch(() => null) : null;
  const client = parseClient(body);
  if (typeof body !== "object" || body === null || !client) return { response, client: null };
  const detail = body as Record<string, unknown>;
  const optional = (field: string) => isOptionalNullableString(detail[field]) ? detail[field] ?? null : undefined;
  const address = detail.address;
  const visitFrequencyDays = detail.visitFrequencyDays;
  if (
    typeof address !== "string" ||
    ["documentType", "documentNumber", "phone", "email"].some((field) => optional(field) === undefined) ||
    !(visitFrequencyDays === undefined || visitFrequencyDays === null || (typeof visitFrequencyDays === "number" && Number.isInteger(visitFrequencyDays) && visitFrequencyDays >= 1 && visitFrequencyDays <= 365))
  ) return { response, client: null };
  return { response, client: {
    ...client,
    address,
    documentType: optional("documentType") as string | null,
    documentNumber: optional("documentNumber") as string | null,
    phone: optional("phone") as string | null,
    email: optional("email") as string | null,
    visitFrequencyDays: visitFrequencyDays ?? null,
  } };
}
function parseDuplicateCheck(value: unknown): ClientDuplicateCheckResult | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (typeof result.hasPossibleDuplicates !== "boolean" || !Array.isArray(result.candidates)) return null;
  const candidates = result.candidates.map((candidate) => {
    if (typeof candidate !== "object" || candidate === null) return null;
    const entry = candidate as Record<string, unknown>;
    if (typeof entry.score !== "number" || !Number.isFinite(entry.score) || !Array.isArray(entry.matchedFields) || !entry.matchedFields.every((field) => typeof field === "string")) return null;
    return parseClient(entry.customer);
  });
  if (candidates.some((candidate) => candidate === null) || result.hasPossibleDuplicates !== (candidates.length > 0)) return null;
  return { hasPossibleDuplicates: result.hasPossibleDuplicates, candidates: candidates as Client[] };
}
export async function checkClientDuplicate(input: ClientDuplicateCheckInput): Promise<{ response: Response; result: ClientDuplicateCheckResult | null }> {
  const response = await apiRequest("/customers/duplicate-checks", {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify({
      name: input.name.trim(),
      ...(optionalString(input.documentNumber) ? { documentNumber: optionalString(input.documentNumber) } : {}),
      ...(optionalString(input.phone) ? { phone: optionalString(input.phone) } : {}),
      ...(optionalString(input.address) ? { address: optionalString(input.address) } : {}),
      location: { latitude: input.latitude, longitude: input.longitude },
      ...(input.excludeCustomerId ? { excludeCustomerId: input.excludeCustomerId } : {}),
    }),
  }, { publishErrors: false });
  return { response, result: response.status === 200 ? parseDuplicateCheck(await response.json().catch(() => null)) : null };
}
export async function listActiveTerritories(): Promise<{ response: Response; territories: readonly TerritoryOption[] | null }> { const result = await listReferences("/territories?status=ACTIVE", parseTerritory); return { response: result.response, territories: result.items?.map((item) => ({ id: item.id, name: item.label, code: item.code })) ?? null }; }
