import { expect, test } from "vitest";
import { ApiConfigurationError, normalizeApiError, resolveApiUrl } from "./api";

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

test.each([401, 403, 404, 409, 422, 500] as const)(
  "normalizes HTTP %i without exposing problem details",
  async (status) => {
    const error = await normalizeApiError(
      new Response(
        JSON.stringify({
          correlationId: "body-correlation",
          detail: "token=secret@example.test",
          instance: "/private/resource",
          fieldErrors: [
            { field: "email", code: "INVALID", message: "private message" },
            { field: "<script>", code: "INVALID", message: "unsafe" },
          ],
        }),
        { status, headers: { "X-Correlation-Id": "header-correlation" } },
      ),
    );

    expect(error).toEqual({
      status,
      correlationId: "header-correlation",
      fieldErrors: [{ field: "email", code: "INVALID" }],
    });
  },
);
