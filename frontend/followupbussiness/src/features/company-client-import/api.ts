import { apiRequest, safeCorrelationId } from "../../lib/api";
import { getSessionAuthorization, getSessionMutationAuthorization } from "../auth/auth";
import type { CustomerImportJob, CustomerImportStatus } from "./types";

const xlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const statuses = new Set<CustomerImportStatus>(["PENDING", "PROCESSING", "COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const nonNegativeInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

function parseJob(value: unknown): CustomerImportJob | null {
  if (typeof value !== "object" || value === null) return null;
  const job = value as Record<string, unknown>;
  const id = typeof job.id === "string" ? job.id : job.importId;
  if (typeof id !== "string" || !uuid.test(id) || typeof job.status !== "string" || !statuses.has(job.status as CustomerImportStatus) || !nonNegativeInteger(job.acceptedRows) || !nonNegativeInteger(job.rejectedRows) || typeof job.createdAt !== "string" || (job.totalRows !== undefined && job.totalRows !== null && !nonNegativeInteger(job.totalRows)) || (job.completedAt !== null && typeof job.completedAt !== "string" && job.completedAt !== undefined)) return null;
  const failureReason = job.failureReason === "INVALID_TEMPLATE" ? job.failureReason : null;
  return { id, status: job.status as CustomerImportStatus, totalRows: nonNegativeInteger(job.totalRows) ? job.totalRows : null, acceptedRows: job.acceptedRows, rejectedRows: job.rejectedRows, createdAt: job.createdAt, completedAt: typeof job.completedAt === "string" ? job.completedAt : null, errorFileExpiresAt: typeof job.errorFileExpiresAt === "string" ? job.errorFileExpiresAt : null, failureReason };
}

function failure(response: Response) {
  return { response, correlationId: safeCorrelationId(response.headers.get("X-Correlation-Id")) };
}

export async function downloadCustomerImportTemplate(): Promise<{ response: Response; templateVersion: string | null; blob: Blob | null; correlationId: string | null }> {
  const response = await apiRequest("/customers/import-template", { method: "GET", headers: { ...getSessionAuthorization(), Accept: `text/csv, ${xlsx}` } }, { publishErrors: false });
  return { ...failure(response), templateVersion: response.status === 200 ? response.headers.get("X-Template-Version") : null, blob: response.status === 200 ? await response.blob() : null };
}

/** Reads the contractual version header without triggering a browser download. */
export async function getCustomerImportTemplateVersion(): Promise<{ response: Response; templateVersion: string | null; correlationId: string | null }> {
  const response = await apiRequest("/customers/import-template", { method: "GET", headers: { ...getSessionAuthorization(), Accept: `text/csv, ${xlsx}` } }, { publishErrors: false });
  const templateVersion = response.status === 200 ? response.headers.get("X-Template-Version") : null;
  if (response.status === 200) await response.body?.cancel().catch(() => undefined);
  return { ...failure(response), templateVersion };
}

export async function createCustomerImport(input: { file: File; templateVersion: string; partialAcceptance: boolean; idempotencyKey: string }): Promise<{ response: Response; job: CustomerImportJob | null; correlationId: string | null }> {
  const body = new FormData();
  body.set("templateVersion", input.templateVersion);
  body.set("partialAcceptance", String(input.partialAcceptance));
  body.set("file", input.file);
  const response = await apiRequest("/customer-imports", { method: "POST", headers: { ...getSessionMutationAuthorization(), "Idempotency-Key": input.idempotencyKey }, body }, { publishErrors: false });
  return { ...failure(response), job: response.status === 202 ? parseJob(await response.json().catch(() => null)) : null };
}

export async function getCustomerImport(id: string, signal?: AbortSignal): Promise<{ response: Response; job: CustomerImportJob | null; correlationId: string | null }> {
  const response = await apiRequest(`/customer-imports/${encodeURIComponent(id)}`, { method: "GET", headers: getSessionAuthorization(), ...(signal === undefined ? {} : { signal }) }, { publishErrors: false });
  return { ...failure(response), job: response.status === 200 ? parseJob(await response.json().catch(() => null)) : null };
}

export async function downloadCustomerImportErrors(id: string, signal?: AbortSignal): Promise<{ response: Response; blob: Blob | null; correlationId: string | null }> {
  const response = await apiRequest(`/customer-imports/${encodeURIComponent(id)}/errors`, { method: "GET", headers: { ...getSessionAuthorization(), Accept: "text/csv" }, ...(signal === undefined ? {} : { signal }) }, { publishErrors: false });
  return { ...failure(response), blob: response.status === 200 ? await response.blob() : null };
}
