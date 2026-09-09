import { apiRequest } from "../../lib/api";
import { getSessionAuthorization, getSessionMutationAuthorization } from "../auth/auth";
import type { CompanySettings, CompanySettingsSnapshot, UpdateCompanySettingsInput } from "./types";

const etagPattern = /^"[1-9][0-9]*"$/;
const integer = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);
const validTime = (value: unknown): value is string => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
function parse(value: unknown): CompanySettings | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.timezone !== "string" || typeof item.currency !== "string" || item.geofenceRadiusMeters !== 100 || item.trackingIntervalSeconds !== 60 || (item.locationRetentionDays !== undefined && item.locationRetentionDays !== 90) || (item.saleEditWindowMinutes !== undefined && item.saleEditWindowMinutes !== null && (!integer(item.saleEditWindowMinutes) || item.saleEditWindowMinutes < 0 || item.saleEditWindowMinutes > 10080)) || (item.planningDayStart !== undefined && item.planningDayStart !== null && !validTime(item.planningDayStart)) || (item.planningDayEnd !== undefined && item.planningDayEnd !== null && !validTime(item.planningDayEnd)) || ((item.planningDayStart === undefined || item.planningDayStart === null) !== (item.planningDayEnd === undefined || item.planningDayEnd === null))) return null;
  return { timezone: item.timezone, currency: item.currency, geofenceRadiusMeters: 100, trackingIntervalSeconds: 60, locationRetentionDays: item.locationRetentionDays === 90 ? 90 : null, saleEditWindowMinutes: item.saleEditWindowMinutes as number | undefined ?? null, planningDayStart: validTime(item.planningDayStart) ? item.planningDayStart.slice(0, 5) : null, planningDayEnd: validTime(item.planningDayEnd) ? item.planningDayEnd.slice(0, 5) : null };
}
const correlationId = () => crypto.randomUUID();
function headers(mutation = false): HeadersInit { return { ...(mutation ? getSessionMutationAuthorization() : getSessionAuthorization()), "X-Correlation-Id": correlationId() }; }

export async function getCompanySettings(): Promise<{ response: Response; snapshot: CompanySettingsSnapshot | null }> {
  const response = await apiRequest("/company/settings", { method: "GET", headers: headers() });
  const settings = response.status === 200 ? parse(await response.json().catch(() => null)) : null;
  const etag = response.headers.get("ETag");
  return { response, snapshot: settings !== null && etag !== null && etagPattern.test(etag) ? { settings, etag } : null };
}
export async function updateCompanySettings(input: UpdateCompanySettingsInput, etag: string): Promise<{ response: Response; snapshot: CompanySettingsSnapshot | null }> {
  const response = await apiRequest("/company/settings", { method: "PATCH", headers: { ...headers(true), "Content-Type": "application/json", "If-Match": etag }, body: JSON.stringify({ currency: input.currency, ...(input.saleEditWindowMinutes === null ? {} : { saleEditWindowMinutes: input.saleEditWindowMinutes }), planningDayStart: input.planningDayStart, planningDayEnd: input.planningDayEnd }) }, { publishErrors: false });
  const settings = response.status === 200 ? parse(await response.json().catch(() => null)) : null;
  const nextEtag = response.headers.get("ETag");
  return { response, snapshot: settings !== null && nextEtag !== null && etagPattern.test(nextEtag) ? { settings, etag: nextEtag } : null };
}
