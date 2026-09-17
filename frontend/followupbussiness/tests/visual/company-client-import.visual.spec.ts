import { expect, test, type Page, type TestInfo } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const correlationId = "123e4567-e89b-42d3-a456-426614174000";
const mockupPath = "file:///C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/docs/frontendMockups/FE-012.html";
const xlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Options = {
  role?: "COMPANY_ADMIN" | "SUPERVISOR";
  versionDelay?: boolean;
  downloadDelay?: boolean;
  submitDelay?: boolean;
  submitStatus?: number;
};

function identity(role: Options["role"] = "COMPANY_ADMIN") {
  return {
    channel: "WEB",
    credentials: { accessToken: "visual-token", tokenType: "Bearer", expiresIn: 600 },
    csrfToken: "c".repeat(43),
    user: { id: "identity-visual", displayName: "Alex Medina", email: "alex.medina@comercialandina.example", status: "ACTIVE", roles: [role], company: { id: "company-visual", legalName: "Comercial Andina" } },
  };
}

async function open(page: Page, options: Options = {}) {
  const current = identity(options.role);
  let templateRequests = 0;
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/customers/import-template")) {
      templateRequests += 1;
      if ((options.versionDelay && templateRequests === 1) || (options.downloadDelay && templateRequests > 2)) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        return;
      }
      await route.fulfill({ status: 200, contentType: "text/csv", headers: { "X-Template-Version": "2026.09" }, body: "version,nombre\n2026.09," });
      return;
    }
    if (url.pathname.endsWith("/customer-imports") && request.method() === "POST") {
      if (options.submitDelay) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        return;
      }
      const status = options.submitStatus ?? 202;
      const body = status === 202 ? { importId: "00000000-0000-4000-8000-000000000012", status: "PENDING", totalRows: null, acceptedRows: 0, rejectedRows: 0, createdAt: "2026-09-14T20:00:00Z", completedAt: null, errorFileExpiresAt: null } : {};
      await route.fulfill({
        status,
        contentType: "application/json",
        ...(status === 500 ? { headers: { "X-Correlation-Id": correlationId } } : {}),
        body: JSON.stringify(body),
      });
      return;
    }
    const body = url.pathname.endsWith("/me") ? current.user : current;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill("alex.medina@comercialandina.example");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto("/company/customer-imports");
  if (options.role === "SUPERVISOR") await expect(page.getByRole("heading", { name: "No tienes permisos" })).toBeVisible();
  else if (options.versionDelay) await expect(page.getByText(/Comprobando la versión vigente/)).toBeVisible();
  else await expect(page.getByText(/Plantilla vigente comprobada/)).toBeVisible();
}

async function selectFile(page: Page, name: string, mimeType: string, size: number) {
  await page.getByLabel("Elige un archivo para importar").setInputFiles({ name, mimeType, buffer: Buffer.alloc(size, 1) });
}

async function snap(page: Page, name: string) {
  await expect(page).toHaveScreenshot(`fe-012-${name}.png`, { animations: "disabled", maxDiffPixelRatio: 0.02 });
}

async function compare(page: Page, info: TestInfo, name: string, mockupState: string, dark = false) {
  const size = page.viewportSize();
  if (size === null) throw new Error("El viewport visual debe estar definido.");
  const app = await page.screenshot({ animations: "disabled" });
  const appScrollY = await page.evaluate(() => window.scrollY);
  const mockup = await page.context().newPage();
  await mockup.setViewportSize(size);
  await mockup.goto(`${mockupPath}?state=${mockupState}${dark ? "&theme=dark" : ""}`);
  await mockup.evaluate((scrollY) => window.scrollTo(0, scrollY), appScrollY);
  const golden = await mockup.screenshot({ animations: "disabled" });
  const sheet = await page.context().newPage();
  await sheet.setViewportSize({ width: size.width * 2, height: size.height });
  await sheet.setContent(`<style>body{margin:0;background:#14110a}main{display:grid;grid-template-columns:repeat(2,${size.width}px);gap:2px}img{width:${size.width}px;height:${size.height}px}</style><main><img alt="Aplicación" src="data:image/png;base64,${app.toString("base64")}"><img alt="Mockup" src="data:image/png;base64,${golden.toString("base64")}"></main>`);
  const path = info.outputPath(`comparativo-${name}-${size.width}x${size.height}.png`);
  await sheet.screenshot({ path, animations: "disabled" });
  await info.attach(`comparativo-${name}-${size.width}x${size.height}`, { path, contentType: "image/png" });
  await mockup.close();
  await sheet.close();
}

test("FE-012 ready-empty", async ({ page }, info) => {
  await page.setViewportSize(desktop); await open(page); await snap(page, "ready-empty"); await compare(page, info, "ready-empty", "ready-empty");
});

for (const [name, size] of [["desktop-1280", { width: 1280, height: 800 }], ["tablet", { width: 768, height: 1024 }]] as const) test(`FE-012 ${name}`, async ({ page }, info) => {
  await page.setViewportSize(size); await open(page);
  await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await snap(page, name);
  await compare(page, info, name, "ready-empty");
});

test("FE-012 checking-template-version", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page, { versionDelay: true }); await snap(page, "checking-template-version");
});

test("FE-012 template-downloading", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page, { downloadDelay: true }); await page.getByRole("button", { name: "Descargar plantilla" }).click(); await expect(page.getByRole("button", { name: "Descargando…" })).toBeDisabled(); await snap(page, "template-downloading");
});

test("FE-012 file-selected-csv", async ({ page }, info) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes-septiembre.csv", "text/csv", 862_208); await snap(page, "file-selected-csv"); await compare(page, info, "file-selected-csv", "file-selected-csv");
});

test("FE-012 file-selected-xlsx", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes-lima.xlsx", xlsxType, 10_276_045); await snap(page, "file-selected-xlsx");
});

test("FE-012 long-filename", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes-lima-norte-septiembre-version-final-corregida.xlsx", xlsxType, 6_710_886); await snap(page, "long-filename");
});

test("FE-012 invalid-format", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes.xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12", 128); await expect(page.getByRole("alert")).toContainText("macros"); await snap(page, "invalid-format");
});

test("FE-012 file-too-large", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes.csv", "text/csv", 10 * 1024 * 1024 + 1); await expect(page.getByRole("alert")).toContainText("supera el límite"); await snap(page, "file-too-large");
});

test("FE-012 partial-on", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes-septiembre.csv", "text/csv", 862_208); await expect(page.getByRole("checkbox")).toBeChecked(); await snap(page, "partial-on");
});

test("FE-012 partial-off", async ({ page }) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes-septiembre.csv", "text/csv", 862_208); await page.getByRole("checkbox").uncheck(); await expect(page.getByText(/Con esta opción desmarcada/)).toBeVisible(); await snap(page, "partial-off");
});

test("FE-012 submitting", async ({ page }, info) => {
  await page.setViewportSize(desktop); await open(page, { submitDelay: true }); await selectFile(page, "clientes-septiembre.csv", "text/csv", 862_208); await page.getByRole("button", { name: "Iniciar importación" }).click(); await expect(page.getByRole("button", { name: "Enviando…" })).toBeDisabled(); await snap(page, "submitting"); await compare(page, info, "submitting", "submitting");
});

for (const status of [409, 422] as const) test(`FE-012 error-${status}`, async ({ page }, info) => {
  await page.setViewportSize(desktop); await open(page, { submitStatus: status }); await selectFile(page, "clientes-septiembre.csv", "text/csv", 862_208); await page.getByRole("button", { name: "Iniciar importación" }).click(); await expect(page.getByRole("alert")).toBeVisible(); await snap(page, `error-${status}`); await compare(page, info, `error-${status}`, `submit-error-${status}`);
});

test("FE-012 forbidden", async ({ page }, info) => {
  await page.setViewportSize(desktop); await open(page, { role: "SUPERVISOR" }); await expect(page.getByRole("button", { name: "Carga de clientes" })).toHaveCount(0); await snap(page, "forbidden"); await compare(page, info, "forbidden", "forbidden");
});

test("FE-012 mobile", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page); await selectFile(page, "clientes-septiembre.csv", "text/csv", 862_208); await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true); await snap(page, "mobile"); await compare(page, info, "mobile", "mobile-file-selected");
});

test("FE-012 mobile-long-filename", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await selectFile(page, "clientes-lima-norte-septiembre-version-final-corregida.xlsx", xlsxType, 6_710_886);
  await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await snap(page, "mobile-long-filename");
});

test("FE-012 dark", async ({ page }, info) => {
  await page.setViewportSize(desktop); await open(page); await selectFile(page, "clientes-lima-norte-septiembre-version-final-corregida.xlsx", xlsxType, 6_710_886); await page.getByRole("switch", { name: "Modo oscuro" }).click(); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark"); await snap(page, "dark"); await compare(page, info, "dark", "dark-file-selected", true);
});
