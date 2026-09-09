import { beforeEach, expect, test, vi } from "vitest";
import { getCompanySettings, updateCompanySettings } from "./api";

const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiRequest: state.request }));
vi.mock("../auth/auth", () => ({ getSessionAuthorization: () => ({ Authorization: "Bearer read" }), getSessionMutationAuthorization: () => ({ Authorization: "Bearer write" }) }));
beforeEach(() => { state.request.mockReset(); vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000001" }); });
const settings = { timezone: "America/Lima", currency: "PEN", geofenceRadiusMeters: 100, trackingIntervalSeconds: 60, locationRetentionDays: 90, saleEditWindowMinutes: 30, planningDayStart: "08:00:00", planningDayEnd: "18:00:00" };
test("lee ETag contractual y lo reenvía literalmente en If-Match", async () => {
  state.request.mockResolvedValueOnce(new Response(JSON.stringify(settings), { status: 200, headers: { ETag: "\"7\"" } })).mockResolvedValueOnce(new Response(JSON.stringify(settings), { status: 200, headers: { ETag: "\"8\"" } }));
  const read = await getCompanySettings();
  expect(read.snapshot?.etag).toBe("\"7\"");
  await updateCompanySettings({ currency: "PEN", saleEditWindowMinutes: 30, planningDayStart: "08:00", planningDayEnd: "18:00" }, read.snapshot!.etag);
  expect(state.request).toHaveBeenLastCalledWith("/company/settings", expect.objectContaining({ method: "PATCH", headers: expect.objectContaining({ "If-Match": "\"7\"", "X-Correlation-Id": "00000000-0000-4000-8000-000000000001" }) }), { publishErrors: false });
  expect(JSON.parse(state.request.mock.calls.at(-1)?.[1].body)).toEqual({ currency: "PEN", saleEditWindowMinutes: 30, planningDayStart: "08:00", planningDayEnd: "18:00" });
});
test("rechaza una respuesta exitosa sin ETag válido", async () => { state.request.mockResolvedValue(new Response(JSON.stringify(settings), { status: 200 })); await expect(getCompanySettings()).resolves.toMatchObject({ snapshot: null }); });
test("acepta ventana de edición nula devuelta por el contrato", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ ...settings, saleEditWindowMinutes: null }), { status: 200, headers: { ETag: "\"7\"" } }));
  await expect(getCompanySettings()).resolves.toMatchObject({ snapshot: { settings: { saleEditWindowMinutes: null }, etag: "\"7\"" } });
});
test("rechaza una jornada incompleta para no presentar un snapshot inconsistente", async () => {
  state.request.mockResolvedValue(new Response(JSON.stringify({ ...settings, planningDayEnd: null }), { status: 200, headers: { ETag: "\"7\"" } }));
  await expect(getCompanySettings()).resolves.toMatchObject({ snapshot: null });
});
