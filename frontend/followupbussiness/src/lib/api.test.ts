import { expect, test } from "vitest";
import { ApiConfigurationError, normalizeApiError, resolveApiUrl } from "./api";

test("resolves login against an HTTPS backend base URL", () => {
  expect(resolveApiUrl("https://localhost:8080", "/auth/login")).toBe(
    "https://localhost:8080/auth/login",
  );
});

test("allows HTTP only for loopback when local development opts in", () => {
  expect(resolveApiUrl("http://localhost:8080", "/auth/login", true)).toBe(
    "http://localhost:8080/auth/login",
  );
  expect(resolveApiUrl("http://127.0.0.1:8080", "/auth/login", true)).toBe(
    "http://127.0.0.1:8080/auth/login",
  );
  expect(() =>
    resolveApiUrl("http://api.example.test", "/auth/login", true),
  ).toThrow(ApiConfigurationError);
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
