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
  if (typeof job.id !== "string" || !uuid.test(job.id) || typeof job.status !== "string" || !statuses.has(job.status as CustomerImportStatus) || !nonNegativeInteger(job.totalRows) || !nonNegativeInteger(job.acceptedRows) || !nonNegativeInteger(job.rejectedRows) || typeof job.createdAt !== "string" || (job.completedAt !== null && typeof job.completedAt !== "string" && job.completedAt !== undefined)) return null;
  return { id: job.id, status: job.status as CustomerImportStatus, totalRows: job.totalRows, acceptedRows: job.acceptedRows, rejectedRows: job.rejectedRows, createdAt: job.createdAt, completedAt: typeof job.completedAt === "string" ? job.completedAt : null };
}

function failure(response: Response) {
  return { response, correlationId: safeCorrelationId(response.headers.get("X-Correlation-Id")) };
}

export async function downloadCustomerImportTemplate(): Promise<{ response: Response; templateVersion: string | null; blob: Blob | null; correlationId: string | null }> {
  const response = await apiRequest("/customers/import-template", { method: "GET", headers: { ...getSessionAuthorization(), Accept: `text/csv, ${xlsx}` } }, { publishErrors: false });
  return { ...failure(response), templateVersion: response.status === 200 ? response.headers.get("X-Template-Version") : null, blob: response.status === 200 ? await response.blob() : null };
}

export async function createCustomerImport(input: { file: File; templateVersion: string; partialAcceptance: boolean; idempotencyKey: string }): Promise<{ response: Response; job: CustomerImportJob | null; correlationId: string | null }> {
  const body = new FormData();
  body.set("templateVersion", input.templateVersion);
  body.set("partialAcceptance", String(input.partialAcceptance));
  body.set("file", input.file);
  const response = await apiRequest("/customer-imports", { method: "POST", headers: { ...getSessionMutationAuthorization(), "Idempotency-Key": input.idempotencyKey }, body }, { publishErrors: false });
  return { ...failure(response), job: response.status === 202 ? parseJob(await response.json().catch(() => null)) : null };
}

export async function getCustomerImport(id: string): Promise<{ response: Response; job: CustomerImportJob | null; correlationId: string | null }> {
  const response = await apiRequest(`/customer-imports/${encodeURIComponent(id)}`, { method: "GET", headers: getSessionAuthorization() }, { publishErrors: false });
  return { ...failure(response), job: response.status === 200 ? parseJob(await response.json().catch(() => null)) : null };
}
