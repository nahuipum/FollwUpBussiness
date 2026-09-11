import { afterEach, expect, test, vi } from "vitest";
import { ApiConfigurationError, apiRequest, normalizeApiError, resolveApiUrl, subscribeToApiErrors } from "./api";

const validCorrelationId = "00000000-0000-4000-8000-000000000001";

afterEach(() => vi.unstubAllGlobals());

test("permite publicar solo un 401 cuando el feature presenta los demás errores localmente", async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeToApiErrors(listener);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 403 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ correlationId: validCorrelationId }), { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  const publishOnlyUnauthorized = (status: number) => status === 401;

  await apiRequest("/company/users", { method: "GET" }, { publishErrors: publishOnlyUnauthorized });
  expect(listener).not.toHaveBeenCalled();
  await apiRequest("/company/users", { method: "GET" }, { publishErrors: publishOnlyUnauthorized });
  await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 401, correlationId: validCorrelationId }), 0));
  unsubscribe();
});

test("resolves login against an HTTPS backend base URL", () => {
  expect(resolveApiUrl("https://localhost:8080", "/auth/login")).toBe(
    "https://localhost:8080/auth/login",
  );
});

test("keeps every development API request on the Vite origin", () => {
  expect(resolveApiUrl("/", "/platform/companies?page=0", true)).toBe(
    "/api/platform/companies?page=0",
  );
  expect(resolveApiUrl("http://localhost:8080", "/platform/companies", true)).toBe(
    "/api/platform/companies",
  );
  expect(resolveApiUrl("https://backend.example.test", "/auth/refresh", true)).toBe(
    "/api/auth/refresh",
  );
  expect(resolveApiUrl(undefined, "/auth/login", true)).toBe("/api/auth/login");
});

test.each([undefined, "", "   ", "http://localhost:8080"])(
  "rejects a missing or insecure API base URL outside local development: %s",
  (baseUrl) => {
    expect(() => resolveApiUrl(baseUrl, "/auth/login")).toThrow(
      ApiConfigurationError,
    );
  },
);

test.each([400, 401, 403, 404, 409, 422, 500] as const)(
  "normalizes HTTP %i without exposing problem details",
  async (status) => {
    const error = await normalizeApiError(
      new Response(
        JSON.stringify({
          correlationId: "00000000-0000-4000-8000-000000000002",
          detail: "token=secret@example.test",
          instance: "/private/resource",
          fieldErrors: [
            { field: "email", code: "INVALID", message: "private message" },
            { field: "<script>", code: "INVALID", message: "unsafe" },
          ],
        }),
        { status, headers: { "X-Correlation-Id": validCorrelationId } },
      ),
    );

    expect(error).toEqual({
      status,
      correlationId: validCorrelationId,
      fieldErrors: [{ field: "email", code: "INVALID" }],
    });
  },
);

test("rejects invalid correlation IDs from the header and body", async () => {
  const error = await normalizeApiError(
    new Response(JSON.stringify({ correlationId: "not-a-uuid" }), {
      status: 400,
      headers: { "X-Correlation-Id": "00000000-0000-5000-8000-000000000001" },
    }),
  );

  expect(error?.correlationId).toBeNull();
});

test("preserva solo el código público de ubicación de extremos", async () => {
  const error = await normalizeApiError(
    new Response(JSON.stringify({
      code: "ROUTE_ENDPOINT_LOCATION_REQUIRED",
      detail: "coordenadas internas: -12.0464,-77.0428",
    }), { status: 422 }),
  );

  expect(error?.code).toBe("ROUTE_ENDPOINT_LOCATION_REQUIRED");
  expect(error).not.toHaveProperty("detail");
});

test("preserva solo el código público de visitas de territorios distintos", async () => {
  const error = await normalizeApiError(
    new Response(JSON.stringify({
      code: "MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED",
      detail: "territorios internos: a, b",
    }), { status: 422 }),
  );

  expect(error?.code).toBe("MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED");
  expect(error).not.toHaveProperty("detail");
});

test("preserva el código público de visita sin territorio", async () => {
  const error = await normalizeApiError(
    new Response(JSON.stringify({
      code: "VISIT_TERRITORY_REQUIRED",
      detail: "territorio interno: 89b78325-2e4d-4f0c-ac46-d0ed8a0be695",
    }), { status: 422 }),
  );

  expect(error?.code).toBe("VISIT_TERRITORY_REQUIRED");
  expect(error).not.toHaveProperty("detail");
});

test("preserva el código público de visita fuera de los territorios del vendedor", async () => {
  const error = await normalizeApiError(
    new Response(JSON.stringify({
      code: "VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER",
      detail: "territorio interno: 89b78325-2e4d-4f0c-ac46-d0ed8a0be695",
    }), { status: 422 }),
  );

  expect(error?.code).toBe("VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER");
  expect(error).not.toHaveProperty("detail");
});
