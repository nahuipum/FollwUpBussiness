import { expect, test } from "vitest";
import { ApiConfigurationError, resolveApiUrl } from "./api";

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
