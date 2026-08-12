import { apiRequest } from "../../lib/api";
import {
  getSessionAuthorization,
  getSessionMutationAuthorization,
} from "../auth/auth";
import type {
  CompanyUser,
  CompanyUserInput,
  CompanyUserPage,
  CompanyUserRole,
  CompanyUserStatus,
} from "./types";

function isRole(value: unknown): value is CompanyUserRole {
  return value === "COMPANY_ADMIN" || value === "SUPERVISOR";
}

function isStatus(value: unknown): value is CompanyUserStatus {
  return value === "INVITED" || value === "ACTIVE" || value === "INACTIVE" || value === "LOCKED";
}

function parseUser(value: unknown): CompanyUser | null {
  if (typeof value !== "object" || value === null) return null;
  const user = value as Record<string, unknown>;
  return typeof user.id === "string" && typeof user.displayName === "string" &&
      typeof user.email === "string" && isRole(user.role) && isStatus(user.status) &&
      typeof user.createdAt === "string" && typeof user.updatedAt === "string" &&
      typeof user.version === "number" && Number.isInteger(user.version)
    ? {
        id: user.id, displayName: user.displayName, email: user.email,
        username: typeof user.username === "string" ? user.username : null,
        role: user.role, status: user.status, createdAt: user.createdAt,
        updatedAt: user.updatedAt, version: user.version,
      }
    : null;
}

function parsePage(value: unknown): CompanyUserPage | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as { items?: unknown; page?: unknown };
  if (!Array.isArray(result.items) || typeof result.page !== "object" || result.page === null)
    return null;
  const page = result.page as Record<string, unknown>;
  if (![page.page, page.pageSize, page.totalElements, page.totalPages].every(
    (entry) => typeof entry === "number" && Number.isInteger(entry) && entry >= 0,
  ) || page.pageSize === 0) return null;
  const items = result.items.map(parseUser);
  return items.some((item) => item === null)
    ? null
    : { items: items as CompanyUser[], page: page as CompanyUserPage["page"] };
}

function mutationHeaders(version?: number, quoteVersion = false): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...getSessionMutationAuthorization(),
    ...(version === undefined
      ? {}
      : { "If-Match": quoteVersion ? `"${version}"` : String(version) }),
  };
}

function inputBody(input: CompanyUserInput) {
  return {
    displayName: input.displayName,
    email: input.email,
    role: input.role,
    ...(input.username?.trim() ? { username: input.username.trim() } : {}),
  };
}

export async function listCompanyUsers(filters: {
  page: number; pageSize: number; search: string; role: CompanyUserRole | null; status: CompanyUserStatus | null;
}): Promise<{ response: Response; page: CompanyUserPage | null }> {
  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.role) query.set("role", filters.role);
  if (filters.status) query.set("status", filters.status);
  const response = await apiRequest(`/company/users?${query}`, { method: "GET", headers: getSessionAuthorization() });
  return { response, page: response.status === 200 ? parsePage(await response.json().catch(() => null)) : null };
}

export async function getCompanyUser(userId: string): Promise<{
  response: Response;
  user: CompanyUser | null;
}> {
  const response = await apiRequest(
    `/company/users/${encodeURIComponent(userId)}`,
    { method: "GET", headers: getSessionAuthorization() },
  );
  return {
    response,
    user: response.status === 200
      ? parseUser(await response.json().catch(() => null))
      : null,
  };
}

async function userMutation(path: string, init: RequestInit): Promise<{ response: Response; user: CompanyUser | null }> {
  const response = await apiRequest(path, init);
  return { response, user: response.status === 200 || response.status === 202 ? parseUser(await response.json().catch(() => null)) : null };
}

export function inviteCompanyUser(input: CompanyUserInput) {
  return userMutation("/company/users", { method: "POST", headers: mutationHeaders(), body: JSON.stringify(inputBody(input)) });
}

export function updateCompanyUser(user: CompanyUser, input: CompanyUserInput) {
  return userMutation(`/company/users/${encodeURIComponent(user.id)}`, { method: "PATCH", headers: mutationHeaders(user.version), body: JSON.stringify(inputBody(input)) });
}

export function correctAndResendCompanyUserInvitation(
  user: CompanyUser,
  input: CompanyUserInput,
) {
  return userMutation(
    `/company/users/${encodeURIComponent(user.id)}/invitation`,
    {
      method: "POST",
      headers: mutationHeaders(user.version, true),
      body: JSON.stringify(inputBody(input)),
    },
  );
}

export function updateCompanyUserStatus(user: CompanyUser, status: "ACTIVE" | "LOCKED") {
  return userMutation(`/company/users/${encodeURIComponent(user.id)}/status`, { method: "PATCH", headers: mutationHeaders(), body: JSON.stringify({ status }) });
}
