import { expect, test, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());

vi.mock("../../lib/api", () => ({ apiRequest: request }));
vi.mock("../auth/auth", () => ({
  getSessionAuthorization: () => ({ Authorization: "Bearer test" }),
  getSessionMutationAuthorization: () => ({
    Authorization: "Bearer test",
    "X-CSRF-Token": "csrf",
  }),
}));

import { correctAndResendCompanyUserInvitation, listCompanyUsers } from "./api";

const invitedUser = {
  id: "user/with space",
  displayName: "Carla Pérez",
  email: "carla@example.com",
  username: null,
  role: "SUPERVISOR" as const,
  status: "INVITED" as const,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  version: 4,
};

test("corrige y reenvía con el endpoint y versión exigidos por contrato", async () => {
  request.mockResolvedValueOnce(
    new Response(JSON.stringify(invitedUser), { status: 202 }),
  );

  const result = await correctAndResendCompanyUserInvitation(invitedUser, {
    displayName: "Carla Pérez",
    email: "carla.nueva@example.com",
    role: "SUPERVISOR",
  });

  expect(request).toHaveBeenCalledWith(
    "/company/users/user%2Fwith%20space/invitation",
    expect.objectContaining({ method: "POST" }),
    expect.objectContaining({ publishErrors: expect.any(Function) }),
  );
  const publishErrors = request.mock.calls[0]?.[2]?.publishErrors as (status: number) => boolean;
  expect(publishErrors(401)).toBe(true);
  expect(publishErrors(403)).toBe(false);
  const init = request.mock.calls[0]?.[1] as RequestInit;
  expect(new Headers(init.headers).get("If-Match")).toBe('"4"');
  expect(JSON.parse(String(init.body))).toEqual({
    displayName: "Carla Pérez",
    email: "carla.nueva@example.com",
    role: "SUPERVISOR",
  });
  expect(result.response.status).toBe(202);
  expect(result.user).toEqual(invitedUser);
});

test("acepta el nombre expuesto por la versión anterior del Backend", async () => {
  request.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...invitedUser, displayName: undefined, name: "Carla Pérez" }], page: { page: 0, pageSize: 20, totalElements: 1, totalPages: 1 } }), { status: 200 }));
  const result = await listCompanyUsers({ page: 0, pageSize: 20, search: "", role: null, status: null });
  expect(result.page?.items[0]?.displayName).toBe("Carla Pérez");
});
