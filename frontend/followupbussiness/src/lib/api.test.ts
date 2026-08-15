import { expect, test } from "vitest";
import { ApiConfigurationError, normalizeApiError, resolveApiUrl } from "./api";

const validCorrelationId = "00000000-0000-4000-8000-000000000001";

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
