import { beforeEach, expect, test, vi } from "vitest";
import { createCustomerImport, downloadCustomerImportTemplate, getCustomerImport } from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request, safeCorrelationId: (value: unknown) => typeof value === "string" ? value : null }));
vi.mock("../auth/auth", () => ({ getSessionAuthorization: () => ({ Authorization: "Bearer session" }), getSessionMutationAuthorization: () => ({ Authorization: "Bearer session", "X-CSRF-Token": "csrf" }) }));
const job = { id: "00000000-0000-4000-8000-000000000001", status: "PENDING", totalRows: 3, acceptedRows: 0, rejectedRows: 0, createdAt: "2026-08-24T10:00:00Z", completedAt: null };

beforeEach(() => state.request.mockReset());

test("descarga la plantilla sin interpretar su contenido y conserva su versión", async () => {
  state.request.mockResolvedValue(new Response("csv content", { status: 200, headers: { "X-Template-Version": "1.0", "Content-Type": "text/csv" } }));
  const result = await downloadCustomerImportTemplate();
  expect(state.request).toHaveBeenCalledWith("/customers/import-template", expect.objectContaining({ headers: expect.objectContaining({ Accept: expect.stringContaining("text/csv") }) }), { publishErrors: false });
  expect(result.templateVersion).toBe("1.0");
  expect(await result.blob?.text()).toBe("csv content");
});

test("envía multipart, CSRF e idempotencia y valida el trabajo aceptado", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify(job), { status: 202 }));
  const result = await createCustomerImport({ file: new File(["x"], "clientes.csv", { type: "text/csv" }), templateVersion: "1.0", partialAcceptance: true, idempotencyKey: "00000000-0000-4000-8000-000000000099" });
  const init = state.request.mock.calls[0]?.[1] as RequestInit;
  expect(init.headers).toMatchObject({ "Idempotency-Key": "00000000-0000-4000-8000-000000000099", "X-CSRF-Token": "csrf" });
  expect(init.body).toBeInstanceOf(FormData);
  expect(result.job).toEqual(job);
});

test("no acepta una respuesta de polling que no cumple el contrato", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ ...job, status: "UNKNOWN" }), { status: 200 }));
  await expect(getCustomerImport(job.id)).resolves.toMatchObject({ job: null });
});
