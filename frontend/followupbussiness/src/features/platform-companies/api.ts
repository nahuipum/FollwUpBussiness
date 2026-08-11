import { apiRequest } from "../../lib/api";
import {
  getSessionAuthorization,
  getSessionMutationAuthorization,
} from "../auth/auth";
import type {
  Company,
  CompanyPage,
  CompanyStatus,
  CompanyCurrency,
  CompanyAdminInvitation,
  CreateCompanyInput,
  ProvisionInitialAdminInput,
} from "./types";

const defaultSettings = {
  geofenceRadiusMeters: 100,
  trackingIntervalSeconds: 60,
} as const;

function requestHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...getSessionMutationAuthorization(),
  };
}

function isCompanyStatus(value: unknown): value is CompanyStatus {
  return value === "ACTIVE" || value === "SUSPENDED";
}

function parseCompany(value: unknown): Company | null {
  if (typeof value !== "object" || value === null) return null;
  const company = value as Record<string, unknown>;
  const settings = company.settings;
  return typeof company.id === "string" &&
      typeof company.legalName === "string" &&
      typeof company.code === "string" &&
      typeof settings === "object" && settings !== null &&
      typeof (settings as Record<string, unknown>).timezone === "string" &&
      isCompanyStatus(company.status)
    ? {
        id: company.id,
        legalName: company.legalName,
        tradeName: typeof company.tradeName === "string" ? company.tradeName : null,
        code: company.code,
        timezone: (settings as Record<string, unknown>).timezone as string,
        status: company.status,
      }
    : null;
}

function isPageInfo(value: unknown): value is CompanyPage["page"] {
  if (typeof value !== "object" || value === null) return false;
  const page = value as Record<string, unknown>;
  return [page.page, page.pageSize, page.totalElements, page.totalPages].every(
    (item) => typeof item === "number" && Number.isInteger(item) && item >= 0,
  ) && page.pageSize !== 0;
}

export async function listCompanies(filters: {
  page: number;
  pageSize: number;
  search: string;
  status: CompanyStatus | null;
}): Promise<{ response: Response; page: CompanyPage | null }> {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.status !== null) query.set("status", filters.status);
  const response = await apiRequest(`/platform/companies?${query}`, {
    method: "GET",
    headers: getSessionAuthorization(),
  });
  if (response.status !== 200) return { response, page: null };
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null) return { response, page: null };
  const value = body as { items?: unknown; page?: unknown };
  if (!Array.isArray(value.items) || !isPageInfo(value.page))
    return { response, page: null };
  const items = value.items.map(parseCompany);
  return items.some((item) => item === null)
    ? { response, page: null }
    : { response, page: { items: items as Company[], page: value.page } };
}

export async function createCompany(input: CreateCompanyInput): Promise<{
  response: Response;
  company: Company | null;
}> {
  const response = await apiRequest("/platform/companies", {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      legalName: input.legalName,
      ...(input.tradeName ? { tradeName: input.tradeName } : {}),
      ...(input.taxId ? { taxId: input.taxId } : {}),
      settings: {
        timezone: input.timezone,
        currency: input.currency,
        ...defaultSettings,
      },
    }),
  });
  return {
    response,
    company: response.status === 201 ? parseCompany(await response.json().catch(() => null)) : null,
  };
}

export async function listCompanyCurrencies(): Promise<{ response: Response; currencies: readonly CompanyCurrency[] | null }> {
  const response = await apiRequest("/platform/companies/currencies", { method: "GET", headers: getSessionAuthorization() });
  const body: unknown = response.status === 200 ? await response.json().catch(() => null) : null;
  if (!Array.isArray(body) || body.some((value) => typeof value !== "object" || value === null || typeof (value as Record<string, unknown>).code !== "string" || typeof (value as Record<string, unknown>).displayName !== "string")) return { response, currencies: null };
  return { response, currencies: body as CompanyCurrency[] };
}

export async function provisionInitialAdmin(
  companyId: string,
  input: ProvisionInitialAdminInput,
): Promise<Response> {
  return apiRequest(`/platform/companies/${encodeURIComponent(companyId)}/initial-admin`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      displayName: input.displayName,
      email: input.email,
      ...(input.username ? { username: input.username } : {}),
    }),
  });
}

const invitationStatuses = new Set([
  "PENDING",
  "SENT",
  "FAILED",
  "ACCEPTED",
]);

function parseAdminInvitation(value: unknown): CompanyAdminInvitation | null {
  if (typeof value !== "object" || value === null) return null;
  const invitation = value as Record<string, unknown>;
  return typeof invitation.id === "string" &&
    typeof invitation.displayName === "string" &&
    typeof invitation.email === "string" &&
    typeof invitation.accountStatus === "string" &&
    typeof invitation.deliveryStatus === "string" &&
    invitationStatuses.has(invitation.deliveryStatus) &&
    typeof invitation.createdAt === "string" &&
    (typeof invitation.deliveredAt === "string" || invitation.deliveredAt === null) &&
    typeof invitation.deliveryAttempts === "number"
    ? invitation as CompanyAdminInvitation
    : null;
}

export async function listCompanyAdminInvitations(companyId: string): Promise<{
  response: Response;
  invitations: readonly CompanyAdminInvitation[] | null;
}> {
  const response = await apiRequest(
    `/platform/companies/${encodeURIComponent(companyId)}/admins`,
    { method: "GET", headers: getSessionAuthorization() },
  );
  const body: unknown = response.status === 200
    ? await response.json().catch(() => null)
    : null;
  if (!Array.isArray(body)) return { response, invitations: null };
  const invitations = body.map(parseAdminInvitation);
  return invitations.some((invitation) => invitation === null)
    ? { response, invitations: null }
    : { response, invitations: invitations as CompanyAdminInvitation[] };
}
