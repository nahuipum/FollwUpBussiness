import { expect, test, type Page } from "@playwright/test";

const session = {
  channel: "WEB",
  credentials: {
    accessToken: "visual-access-token",
    tokenType: "Bearer",
    expiresIn: 600,
  },
  csrfToken: "c".repeat(43),
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    displayName: "Administradora visual",
    email: "visual@example.test",
    status: "ACTIVE",
    roles: ["COMPANY_ADMIN"],
    company: {
      id: "00000000-0000-4000-8000-000000000002",
      legalName: "Empresa visual",
    },
  },
};

async function mockClientPage(page: Page) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/me")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) });
      return;
    }
    if (path.endsWith("/customers")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [{
            id: "customer-1",
            name: "Comercial Norte",
            segment: "Mayorista",
            territoryId: "territory-1",
            assignedSellerIds: ["seller-1"],
            status: "ACTIVE",
            location: { latitude: -12.04, longitude: -77.03 },
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
            version: 1,
          }],
          page: { page: 0, pageSize: 5, totalElements: 1, totalPages: 1 },
        }),
      });
      return;
    }
    if (path.endsWith("/territories")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "territory-1", name: "Centro", code: "CEN" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }),
      });
      return;
    }
    if (path.endsWith("/sellers")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "seller-1", displayName: "Ana Vendedora" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) });
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test(`filtros de clientes alineados en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockClientPage(page);
    await page.goto("/");
    await page.getByLabel("Correo o nombre de usuario").fill("visual@example.test");
    await page.locator("#password").fill("correct-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    if (viewport.name === "mobile") {
      await page.getByRole("button", { name: "Abrir menú" }).click();
    }
    await page.getByRole("button", { name: "Clientes" }).click();

    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByLabel("Buscar cliente por nombre o segmento")).toBeVisible();
    await expect(page.getByLabel("Sin visita desde")).toHaveCSS("border-radius", "10px");
    await expect(page.getByLabel("Sin compra desde")).toHaveCSS("min-height", "43px");
    if (viewport.name === "desktop") {
      const controls = [
        page.locator(".client-list__search"),
        page.getByLabel("Zona"),
        page.getByLabel("Vendedor"),
        page.getByLabel("Estado"),
        page.getByLabel("Sin visita desde"),
        page.getByLabel("Sin compra desde"),
      ];
      const tops = await Promise.all(controls.map(async (control) => Math.round((await control.boundingBox())?.y ?? -1)));
      expect(new Set(tops).size).toBe(1);
    }
    await page.getByLabel("Sin visita desde").click();
    await expect(page.getByRole("dialog", { name: "Calendario de Sin visita desde" })).toHaveCSS("border-radius", "14px");
    await page.screenshot({ path: `test-results/visual/client-filters-${viewport.name}.png`, fullPage: true, animations: "disabled" });
  });
}
