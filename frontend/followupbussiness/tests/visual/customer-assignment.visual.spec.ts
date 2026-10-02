import { expect, test, type Page, type TestInfo } from "@playwright/test";

const mockupPath = "file:///C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/docs/frontendMockups/FE-036.html";
const correlationId = "123e4567-e89b-42d3-a456-426614174036";
const user = {
  id: "identity-visual",
  displayName: "Alex Medina",
  email: "alex.medina@comercialandina.example",
  status: "ACTIVE",
  roles: ["COMPANY_ADMIN"],
  company: { id: "company-visual", legalName: "Comercial Andina" },
};
const session = {
  channel: "WEB",
  credentials: { accessToken: "visual-token", tokenType: "Bearer", expiresIn: 600 },
  csrfToken: "c".repeat(43),
  user,
};
const sellers = [
  { id: "seller-lucia", displayName: "Lucía Calderón", status: "ACTIVE" },
  { id: "seller-rosa", displayName: "Rosa Torres", status: "ACTIVE" },
  { id: "seller-mateo", displayName: "Mateo Salazar", status: "ACTIVE" },
];
const territories = [
  { id: "territory-centro", name: "Lima Centro", status: "ACTIVE" },
  { id: "territory-norte", name: "Lima Norte", status: "ACTIVE" },
];
const clients = [
  { id: "customer-1", name: "Mercado Aurora", status: "ACTIVE", territoryId: "territory-centro", assignedSellerIds: ["seller-lucia"] },
  { id: "customer-2", name: "Distribuidora Sol", status: "ACTIVE", territoryId: "territory-centro", assignedSellerIds: [] },
  { id: "customer-3", name: "Bodega Los Laureles", status: "ACTIVE", territoryId: "territory-norte", assignedSellerIds: ["seller-mateo", "seller-rosa"] },
  { id: "customer-4", name: "Farmacia Central", status: "ACTIVE", territoryId: "territory-centro", assignedSellerIds: ["seller-rosa"] },
  { id: "customer-5", name: "Librería Horizonte", status: "ACTIVE", territoryId: "territory-norte", assignedSellerIds: [] },
  { id: "customer-6", name: "Panadería del Parque", status: "ACTIVE", territoryId: "territory-centro", assignedSellerIds: ["seller-lucia"] },
];

async function openAssignment(page: Page, result: "success" | "partial" = "partial") {
  await page.addInitScript(() => {
    const NativeDate = Date;
    class VisualDate extends NativeDate {
      constructor(...args: ConstructorParameters<DateConstructor>) {
        super(...(args.length ? args : ["2026-09-10T10:42:00-05:00"]));
      }
      static now() { return new NativeDate("2026-09-10T10:42:00-05:00").valueOf(); }
    }
    window.Date = VisualDate as DateConstructor;
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pageBody = (items: readonly unknown[]) => ({ items, page: { page: 0, pageSize: 200, totalElements: items.length, totalPages: 1 } });
    let body: unknown = session;
    let status = 200;
    if (url.pathname.endsWith("/me")) body = user;
    else if (url.pathname.endsWith("/customers") && request.method() === "GET") body = pageBody(clients);
    else if (url.pathname.endsWith("/sellers") && request.method() === "GET") body = pageBody(sellers);
    else if (url.pathname.endsWith("/territories") && request.method() === "GET") body = pageBody(territories);
    else if (url.pathname.endsWith("/customer-assignments/batch")) {
      const input = JSON.parse(request.postData() ?? "{}") as { customerIds?: string[] };
      body = { results: (input.customerIds ?? []).map((customerId, index) => ({ customerId, status: result === "partial" && index === 1 ? "REJECTED" : "ASSIGNED", errorCode: result === "partial" && index === 1 ? "ASSIGNMENT_CHANGED" : null })) };
    } else if (/\/customers\/[^/]+\/assignment$/.test(url.pathname)) {
      status = 204;
      body = null;
    }
    await route.fulfill({ status, contentType: "application/json", headers: { "X-Correlation-Id": correlationId }, body: body === null ? "" : JSON.stringify(body) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill(user.email);
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto("/company/customer-assignments");
  await expect(page.getByRole("heading", { name: "Asignar cartera" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Nuevos responsables y vigencia" })).toBeVisible();
}

async function configure(page: Page) {
  await page.getByRole("button", { name: "Nuevos responsables" }).click();
  await page.getByRole("option", { name: "Lucía Calderón" }).click();
  await page.getByRole("option", { name: "Rosa Torres" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Vigente desde" }).click();
  await page.locator('[data-date="2026-09-18"]').click();
  await page.getByLabel("Motivo (opcional)").fill("Redistribución de cartera por cobertura de zona.");
  await page.getByRole("button", { name: "Continuar a clientes" }).click();
}

async function compare(page: Page, info: TestInfo, name: string, mockupState: string, darkMockup = false) {
  const size = page.viewportSize();
  if (size === null) throw new Error("El viewport visual debe estar definido.");
  const app = await page.screenshot({ animations: "disabled" });
  const mockup = await page.context().newPage();
  await mockup.setViewportSize(size);
  await mockup.goto(`${mockupPath}?state=${mockupState}`);
  if (darkMockup) await mockup.locator("[data-theme-toggle]").first().click();
  const golden = await mockup.screenshot({ animations: "disabled" });
  const sheet = await page.context().newPage();
  await sheet.setViewportSize({ width: size.width * 2, height: size.height });
  await sheet.setContent(`<style>body{margin:0;background:#14110a}main{display:grid;grid-template-columns:repeat(2,${size.width}px);gap:2px}img{width:${size.width}px;height:${size.height}px;object-fit:cover;object-position:top}</style><main><img alt="Aplicación" src="data:image/png;base64,${app.toString("base64")}"><img alt="Mockup" src="data:image/png;base64,${golden.toString("base64")}"></main>`);
  const path = info.outputPath(`comparativo-${name}-${size.width}x${size.height}.png`);
  await sheet.screenshot({ path, animations: "disabled" });
  await info.attach(`comparativo-${name}`, { path, contentType: "image/png" });
  await mockup.close();
  await sheet.close();
}

for (const [name, size, state] of [
  ["desktop-1440", { width: 1440, height: 900 }, "ready-empty-selection"],
  ["desktop-1280", { width: 1280, height: 720 }, "ready-empty-selection"],
  ["tablet-1024", { width: 1024, height: 768 }, "ready-empty-selection"],
  ["mobile-390", { width: 390, height: 844 }, "mobile-ready"],
] as const) {
  test(`FE-036 configuración ${name}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await openAssignment(page);
    await expect(page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth)).resolves.toBe(true);
    await compare(page, info, name, state);
  });
}

test("FE-036 no permite agregar un cliente que ya tiene los nuevos responsables", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAssignment(page);
  await page.getByRole("button", { name: "Nuevos responsables" }).click();
  await page.getByRole("option", { name: "Lucía Calderón" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Vigente desde" }).click();
  await page.locator('[data-date="2026-09-18"]').click();
  await page.getByRole("button", { name: "Continuar a clientes" }).click();
  await expect(page.getByText("Sin cambios").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar Mercado Aurora a la asignación" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Agregar esta página (4)" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("sin-reasignacion-identica.png"), animations: "disabled" });
});

test("FE-036 recorre selección, filtros, revisión, confirmación y resultado parcial", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAssignment(page);
  await configure(page);
  await page.getByRole("button", { name: "Filtrar por zona" }).click();
  await expect(page.getByRole("option", { name: "Lima Centro" })).toBeVisible();
  await page.getByRole("option", { name: "Lima Centro" }).click();
  await page.getByRole("searchbox", { name: "Buscar clientes" }).fill("a");
  await expect(page.getByText("Filtros activos:")).toBeVisible();
  await page.getByRole("button", { name: "Agregar Mercado Aurora a la asignación" }).click();
  await page.getByRole("button", { name: "Agregar Distribuidora Sol a la asignación" }).click();
  await expect(page.getByText("2 clientes seleccionados", { exact: true })).toBeVisible();
  await compare(page, info, "seleccion-y-filtros", "filters-active");
  await page.getByRole("button", { name: "Continuar a revisión" }).click();
  await expect(page.getByText("Actual", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Nuevo", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Confirmar operación" }).click();
  await expect(page.getByRole("alertdialog", { name: "Aplicar la asignación" })).toBeVisible();
  await compare(page, info, "confirmacion", "review-confirmation");
  await page.getByRole("button", { name: "Confirmar asignación" }).click();
  await expect(page.getByRole("dialog", { name: "Asignación completada con rechazos" })).toBeVisible();
  await expect(page.getByText("Asignados: 1")).toBeVisible();
  await expect(page.getByText("Rechazados: 1")).toBeVisible();
  await compare(page, info, "resultado-parcial", "result-partial");
});

test("FE-036 dropdowns permanecen en viewport y el tema oscuro conserva el flujo", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openAssignment(page);
  await page.getByRole("switch", { name: "Modo oscuro" }).click();
  await expect(page.locator(".customer-assignment__step--active")).toHaveCSS("background-color", "rgb(23, 37, 84)");
  await expect(page.locator(".customer-assignment__step-aside")).toHaveCSS("background-color", "rgb(23, 37, 84)");
  await page.getByRole("button", { name: "Nuevos responsables" }).click();
  await page.getByRole("option", { name: "Lucía Calderón" }).click();
  const selectedSeller = page.getByRole("option", { name: "Lucía Calderón" });
  await expect(selectedSeller).toHaveCSS("background-color", "rgb(23, 37, 84)");
  const checkBounds = await selectedSeller.locator(".multi-select__check").boundingBox();
  const copyBounds = await selectedSeller.locator(".multi-select__option-copy").boundingBox();
  expect(checkBounds).not.toBeNull();
  expect(copyBounds).not.toBeNull();
  expect(checkBounds!.x).toBeLessThan(copyBounds!.x);
  expect([checkBounds!.width, checkBounds!.height]).toEqual([20, 20]);
  const sellerMenu = page.getByRole("listbox", { name: "Nuevos responsables" });
  const bounds = await sellerMenu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1280);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(720);
  await compare(page, info, "oscuro-selector", "seller-selector-open", true);
});

test("FE-036 mobile completa el flujo sin scroll horizontal", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAssignment(page, "success");
  await configure(page);
  await page.getByRole("button", { name: "Agregar esta página (5)" }).click();
  await page.getByRole("button", { name: "Continuar a revisión" }).click();
  await expect(page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth)).resolves.toBe(true);
  await page.getByRole("button", { name: "Confirmar operación" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Aplicar la asignación" });
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  await compare(page, info, "mobile-review", "mobile-review");
});
