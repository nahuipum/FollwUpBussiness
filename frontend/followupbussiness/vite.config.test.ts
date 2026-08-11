import { expect, test } from "vitest";
import {
  developmentProxy,
  localHttpsCredentials,
  resolveDevApiProxyTarget,
  viteConfiguration,
} from "./vite.config";

test("keeps local HTTPS optional and rejects incomplete credentials", () => {
  expect(localHttpsCredentials({})).toBeUndefined();
  expect(() => localHttpsCredentials({ FRONTEND_HTTPS_CERT: "certificate.pem" })).toThrow("FRONTEND_HTTPS_KEY");
});

test("only proxies the /api namespace so protected SPA reloads use Vite fallback", () => {
  const proxy = developmentProxy({ VITE_DEV_API_PROXY_TARGET: "http://localhost:8080" });

  expect(Object.keys(proxy)).toEqual(["/api"]);
  expect(proxy["/api"].target).toBe("http://localhost:8080/");
  expect(proxy["/api"].secure).toBe(false);
  expect(proxy["/api"].rewrite("/api/platform/companies?page=0")).toBe(
    "/platform/companies?page=0",
  );
});

test("accepts local HTTP or HTTPS overrides and rejects remote HTTP or malformed targets", () => {
  expect(resolveDevApiProxyTarget("http://127.0.0.1:8081")).toBe("http://127.0.0.1:8081/");
  expect(resolveDevApiProxyTarget("https://api.example.test:8443")).toBe("https://api.example.test:8443/");
  expect(() => resolveDevApiProxyTarget("http://api.example.test:8080")).toThrow("loopback local");
  expect(() => resolveDevApiProxyTarget("not-a-url")).toThrow("HTTP(S)");
});

test("disables certificate verification only for loopback targets", () => {
  const localProxy = developmentProxy({ VITE_DEV_API_PROXY_TARGET: "https://localhost:8080" });
  const remoteProxy = developmentProxy({ VITE_DEV_API_PROXY_TARGET: "https://api.example.test:8443" });

  expect(localProxy["/api"].secure).toBe(false);
  expect(remoteProxy["/api"].secure).toBe(true);
});

test("does not include the development proxy in production configuration", () => {
  expect(viteConfiguration("production", {})).not.toHaveProperty("server");
});
