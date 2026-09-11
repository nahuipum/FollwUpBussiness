import { apiRequest } from "../../lib/api";
import {
  getSessionAuthorization,
  getSessionMutationAuthorization,
} from "../auth/auth";
import type {
  Seller,
  SellerFilters,
  SellerFormInput,
  SellerFormOptions,
  SellerPage,
  SellerReference,
  SellerStatus,
  SellerStatusChangeInput,
  TerritoryReference,
} from "./types";

const publishSessionErrors = {
  publishErrors: (status: number) => status === 401,
} as const;

function sellerApiRequest(path: string, init: RequestInit) {
  return apiRequest(path, init, publishSessionErrors);
}

function isStatus(value: unknown): value is SellerStatus {
  return value === "INVITED" || value === "ACTIVE" || value === "INACTIVE";
}
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function parseSupervisor(value: unknown): Seller["supervisor"] | undefined {
  if (value === null) return null;
  if (typeof value !== "object" || value === null) return undefined;
  const reference = value as Record<string, unknown>;
  return typeof reference.id === "string" &&
    typeof reference.displayName === "string"
    ? { id: reference.id, displayName: reference.displayName }
    : undefined;
}
function parseTerritories(
  value: unknown,
): readonly TerritoryReference[] | null {
  if (!Array.isArray(value)) return null;
  const territories = value.map((entry) => {
    if (typeof entry !== "object" || entry === null) return null;
    const territory = entry as Record<string, unknown>;
    return typeof territory.id === "string" &&
      typeof territory.code === "string" &&
      typeof territory.name === "string"
      ? { id: territory.id, code: territory.code, name: territory.name }
      : null;
  });
  return territories.some((territory) => territory === null)
    ? null
    : (territories as TerritoryReference[]);
}
function parseSeller(value: unknown): Seller | null {
  if (typeof value !== "object" || value === null) return null;
  const seller = value as Record<string, unknown>;
  const supervisor = parseSupervisor(seller.supervisor);
  const territories = parseTerritories(seller.territories);
  if (
    typeof seller.id !== "string" ||
    typeof seller.userId !== "string" ||
    typeof seller.displayName !== "string" ||
    !isStatus(seller.status) ||
    !Array.isArray(seller.territoryIds) ||
    !seller.territoryIds.every((id) => typeof id === "string") ||
    (seller.supervisorId !== null && typeof seller.supervisorId !== "string") ||
    supervisor === undefined ||
    territories === null ||
    typeof seller.createdAt !== "string" ||
    typeof seller.updatedAt !== "string" ||
    !isNonNegativeInteger(seller.version) ||
    seller.version === 0
  )
    return null;
  return {
    id: seller.id,
    userId: seller.userId,
    displayName: seller.displayName,
    email: typeof seller.email === "string" ? seller.email : null,
    phone: typeof seller.phone === "string" ? seller.phone : null,
    employeeCode:
      typeof seller.employeeCode === "string" ? seller.employeeCode : null,
    supervisorId: seller.supervisorId,
    territoryIds: seller.territoryIds,
    supervisor,
    territories,
    status: seller.status,
    createdAt: seller.createdAt,
    updatedAt: seller.updatedAt,
    version: seller.version,
  };
}
function parsePage(value: unknown): SellerPage | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (
    !Array.isArray(result.items) ||
    typeof result.page !== "object" ||
    result.page === null
  )
    return null;
  const page = result.page as Record<string, unknown>;
  if (
    ![page.page, page.pageSize, page.totalElements, page.totalPages].every(
      isNonNegativeInteger,
    ) ||
    page.pageSize === 0
  )
    return null;
  const items = result.items.map(parseSeller);
  return items.some((item) => item === null)
    ? null
    : { items: items as Seller[], page: page as SellerPage["page"] };
}
export async function listSellers(
  filters: SellerFilters,
): Promise<{ response: Response; page: SellerPage | null }> {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.status) query.set("status", filters.status);
  if (filters.supervisorId) query.set("supervisorId", filters.supervisorId);
  if (filters.territoryId) query.set("territoryId", filters.territoryId);
  const response = await sellerApiRequest(`/sellers?${query}`, {
    method: "GET",
    headers: getSessionAuthorization(),
  });
  return {
    response,
    page:
      response.status === 200
        ? parsePage(await response.json().catch(() => null))
        : null,
  };
}

type ReferencePage<T> = Readonly<{
  items: readonly T[];
  page: Readonly<{
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }>;
}>;

function parseReferencePage<T>(
  value: unknown,
  parse: (entry: unknown) => T | null,
): ReferencePage<T> | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (
    !Array.isArray(result.items) ||
    typeof result.page !== "object" ||
    result.page === null
  )
    return null;
  const page = result.page as Record<string, unknown>;
  if (
    ![page.page, page.pageSize, page.totalElements, page.totalPages].every(
      isNonNegativeInteger,
    ) ||
    page.pageSize === 0
  )
    return null;
  const items = result.items.map(parse);
  return items.some((item) => item === null)
    ? null
    : { items: items as T[], page: page as ReferencePage<T>["page"] };
}

function parseSupervisorOption(value: unknown): SellerReference | null {
  if (typeof value !== "object" || value === null) return null;
  const user = value as Record<string, unknown>;
  return typeof user.id === "string" && typeof user.displayName === "string"
    ? { id: user.id, displayName: user.displayName }
    : null;
}

function parseTerritoryOption(value: unknown): TerritoryReference | null {
  if (typeof value !== "object" || value === null) return null;
  const territory = value as Record<string, unknown>;
  return typeof territory.id === "string" &&
    typeof territory.name === "string" &&
    typeof territory.code === "string"
    ? { id: territory.id, name: territory.name, code: territory.code }
    : null;
}

async function listAllReferences<T>(
  path: string,
  parse: (entry: unknown) => T | null,
): Promise<{ response: Response; items: readonly T[] | null }> {
  const firstResponse = await sellerApiRequest(`${path}&page=0&pageSize=100`, {
    method: "GET",
    headers: getSessionAuthorization(),
  });
  const first =
    firstResponse.status === 200
      ? parseReferencePage(await firstResponse.json().catch(() => null), parse)
      : null;
  if (!first || first.page.totalPages <= 1)
    return { response: firstResponse, items: first?.items ?? null };
  const rest = await Promise.all(
    [...Array(first.page.totalPages - 1)].map(async (_, index) => {
      const response = await sellerApiRequest(
        `${path}&page=${index + 1}&pageSize=100`,
        { method: "GET", headers: getSessionAuthorization() },
      );
      return {
        response,
        page:
          response.status === 200
            ? parseReferencePage(await response.json().catch(() => null), parse)
            : null,
      };
    }),
  );
  const failed = rest.find(
    ({ response, page }) => response.status !== 200 || page === null,
  );
  return failed
    ? { response: failed.response, items: null }
    : {
        response: firstResponse,
        items: [
          ...first.items,
          ...rest.flatMap(({ page }) => page?.items ?? []),
        ],
      };
}

export async function listSellerFormOptions(): Promise<{
  response: Response;
  options: SellerFormOptions | null;
}> {
  const [supervisors, territories] = await Promise.all([
    listAllReferences(
      "/company/users?role=SUPERVISOR&status=ACTIVE",
      parseSupervisorOption,
    ),
    listAllReferences("/territories?status=ACTIVE", parseTerritoryOption),
  ]);
  if (supervisors.response.status !== 200)
    return { response: supervisors.response, options: null };
  if (territories.response.status !== 200)
    return { response: territories.response, options: null };
  return supervisors.items && territories.items
    ? {
        response: supervisors.response,
        options: {
          supervisors: supervisors.items,
          territories: territories.items,
        },
      }
    : { response: supervisors.response, options: null };
}

function mutationHeaders(version?: number): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...getSessionMutationAuthorization(),
    ...(version === undefined ? {} : { "If-Match": String(version) }),
  };
}

function createBody(input: SellerFormInput) {
  return {
    displayName: input.displayName,
    email: input.email,
    ...(input.username ? { username: input.username } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.employeeCode ? { employeeCode: input.employeeCode } : {}),
    ...(input.supervisorId ? { supervisorId: input.supervisorId } : {}),
    ...(input.territoryIds.length
      ? { territoryIds: [...new Set(input.territoryIds)] }
      : {}),
  };
}

export function createSeller(input: SellerFormInput) {
  return sellerApiRequest("/sellers", {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(createBody(input)),
  });
}

export async function getSeller(sellerId: string): Promise<{ response: Response; seller: Seller | null }> {
  const response = await sellerApiRequest(`/sellers/${encodeURIComponent(sellerId)}`, {
    method: "GET",
    headers: getSessionAuthorization(),
  });
  return {
    response,
    seller: response.status === 200 ? parseSeller(await response.json().catch(() => null)) : null,
  };
}

export function updateSeller(seller: Seller, input: SellerFormInput) {
  return sellerApiRequest(`/sellers/${encodeURIComponent(seller.id)}`, {
    method: "PATCH",
    headers: mutationHeaders(seller.version),
    body: JSON.stringify({
      displayName: input.displayName,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.employeeCode ? { employeeCode: input.employeeCode } : {}),
    }),
  });
}

export function updateSellerSupervisor(
  sellerId: string,
  supervisorId: string | null,
) {
  return sellerApiRequest(`/sellers/${encodeURIComponent(sellerId)}/supervisor`, {
    method: "PUT",
    headers: mutationHeaders(),
    body: JSON.stringify({ supervisorId }),
  });
}

export function updateSellerTerritories(
  sellerId: string,
  territoryIds: readonly string[],
) {
  return sellerApiRequest(`/sellers/${encodeURIComponent(sellerId)}/territories`, {
    method: "PUT",
    headers: mutationHeaders(),
    body: JSON.stringify({ territoryIds: [...new Set(territoryIds)] }),
  });
}

export async function changeSellerStatus(
  sellerId: string,
  input: SellerStatusChangeInput,
): Promise<{ response: Response; seller: Seller | null }> {
  const response = await sellerApiRequest(
    `/sellers/${encodeURIComponent(sellerId)}/status`,
    {
      method: "PATCH",
      headers: mutationHeaders(),
      body: JSON.stringify({ status: input.status, reason: input.reason }),
    },
  );
  return {
    response,
    seller:
      response.status === 200
        ? parseSeller(await response.json().catch(() => null))
        : null,
  };
}

export async function resendSellerInvitation(
  seller: Seller,
): Promise<{ response: Response; seller: Seller | null }> {
  const response = await sellerApiRequest(
    `/sellers/${encodeURIComponent(seller.id)}/invitation`,
    {
      method: "POST",
      headers: mutationHeaders(seller.version),
    },
  );
  return {
    response,
    seller:
      response.status === 202
        ? parseSeller(await response.json().catch(() => null))
        : null,
  };
}
