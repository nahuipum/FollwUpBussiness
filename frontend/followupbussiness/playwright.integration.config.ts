import { defineConfig } from "@playwright/test";

const hasLocalCredentials = [
  process.env.USER_TENANT_A,
  process.env.PASSWORD_TENANT_A,
  process.env.USER_TENANT_B,
  process.env.PASSWORD_TENANT_B,
].every(Boolean);

export default defineConfig({
  testDir: "./tests/integration",
  timeout: 45_000,
  // Debe coincidir con el origen WEB local que el backend acepta explícitamente.
  use: { baseURL: "http://localhost:5173" },
  // No iniciar un servidor si la suite se omitirá por falta de credenciales locales.
  webServer: hasLocalCredentials ? {
    command: "npx vite --host localhost --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  } : undefined,
});
