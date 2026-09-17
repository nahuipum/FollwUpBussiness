import { expect, test, type Page } from "@playwright/test";

const goldenUrl = "file:///C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/docs/frontendMockups/FE-033.html";
const settings = { timezone: "America/Lima", currency: "PEN", geofenceRadiusMeters: 100, trackingIntervalSeconds: 60, locationRetentionDays: 90, saleEditWindowMinutes: 30, planningDayStart: "08:00:00", planningDayEnd: "18:00:00" };

async function openSettings(page: Page, role: "COMPANY_ADMIN" | "SUPERVISOR") {
  const current = { channel: "WEB", credentials: { accessToken: "visual-token", tokenType: "Bearer", expiresIn: 600 }, csrfToken: "c".repeat(43), user: { id: "visual-user", displayName: "Alex Medina", email: "alex@example.test", status: "ACTIVE", roles: [role], company: { id: "visual-company", legalName: "Comercial Andina" } } };
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({ status: 200, contentType: "application/json", headers: path.endsWith("/settings") ? { ETag: '"7"' } : {}, body: JSON.stringify(path.endsWith("/me") ? current.user : path.endsWith("/settings") ? settings : current) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill("alex@example.test");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto(role === "SUPERVISOR" ? "/supervisor/settings" : "/company/settings");
  await expect(page.getByRole("heading", { name: "Configuración operativa" })).toBeVisible();
}

type Sample = { app: string; golden: string; properties: string[] };
async function compareStyles(appPage: Page, goldenPage: Page, samples: Sample[]) {
  for (const { app, golden, properties } of samples) {
    const get = (page: Page, selector: string) => page.locator(selector).first().evaluate((element, names) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)]));
    }, properties);
    expect(await get(appPage, app), `${app} frente a ${golden}`).toEqual(await get(goldenPage, golden));
  }
}

for (const [name, role, width, height, state, theme] of [
  ["desktop", "COMPANY_ADMIN", 1440, 900, "unchanged", "light"],
  ["móvil solo lectura oscuro", "SUPERVISOR", 390, 844, "readonly", "dark"],
] as const) {
  test(`FE-033 contenido ${name} frente al golden`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await openSettings(page, role);
    if (theme === "dark") await page.getByRole("switch", { name: "Modo oscuro" }).click();
    const goldenPage = await page.context().newPage();
    await goldenPage.setViewportSize({ width, height });
    await goldenPage.goto(`${goldenUrl}?state=${state}&theme=${theme}&guide=0`);
    await compareStyles(page, goldenPage, [
      { app: ".company-settings__card", golden: ".settings-card", properties: ["padding-top", "padding-left", "border-radius", "background-color"] },
      { app: ".company-settings__card-head h2", golden: ".settings-card-head h2", properties: ["font-size", "line-height", "font-weight", "color"] },
      { app: "#sale-window", golden: "#sale-window", properties: ["height", "min-height", "font-size"] },
    ]);
    const content = page.locator(".company-settings");
    await info.attach(`FE-033-app-${name}`, { body: await content.screenshot({ animations: "disabled" }), contentType: "image/png" });
    await info.attach(`FE-033-golden-${name}`, { body: await goldenPage.locator(".settings-page").screenshot({ animations: "disabled" }), contentType: "image/png" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await goldenPage.close();
  });
}
