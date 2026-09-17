import { expect, test, type Page } from "@playwright/test";

type Role = "COMPANY_ADMIN" | "SUPERVISOR";
type Scenario = Readonly<{
  listStatus?: number;
  listDelay?: boolean;
  empty?: boolean;
  noResultsOnSearch?: boolean;
}>;

const baseClient = {
  id: "customer-1",
  name: "Mercado Aurora",
  address: "Av. Arequipa 2450, Lince, Lima",
  documentType: "RUC",
  documentNumber: "20601234567",
  phone: "987654321",
  email: "contacto@mercadoaurora.example",
  segment: "Minorista",
  visitFrequencyDays: 15,
  territoryId: "territory-1",
  assignedSellerIds: ["seller-1", "seller-2"],
  status: "ACTIVE",
  location: { latitude: -12.0864, longitude: -77.0365 },
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-12T15:11:00Z",
  version: 3,
};

function session(role: Role) {
  return {
    channel: "WEB",
    credentials: { accessToken: `visual-${role}`, tokenType: "Bearer", expiresIn: 600 },
    csrfToken: "c".repeat(43),
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      displayName: role === "SUPERVISOR" ? "Alex Medina" : "Administradora visual",
      email: "visual@example.test",
      status: "ACTIVE",
      roles: [role],
      company: { id: "00000000-0000-4000-8000-000000000002", legalName: "Comercial Andina" },
    },
  };
}

const readyClients = [
  baseClient,
  { ...baseClient, id: "customer-2", name: "Botica Horizonte", segment: "Salud", assignedSellerIds: ["seller-1"], status: "INACTIVE" },
  { ...baseClient, id: "customer-3", name: "Distribuidora Cauce", segment: "Distribuidor", assignedSellerIds: ["seller-1", "seller-2", "seller-3"] },
  { ...baseClient, id: "customer-4", name: "Comercial Pinar", segment: "Mayorista", assignedSellerIds: ["seller-2"] },
  { ...baseClient, id: "customer-5", name: "Café Nube", segment: "Gastronomía", assignedSellerIds: [] },
] as const;

async function mockClients(page: Page, role: Role, scenario: Scenario = {}) {
  const current = session(role);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.endsWith("/me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(current.user) });
    if (path.endsWith("/customers/customer-1")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(baseClient) });
    if (path.endsWith("/customers/duplicate-checks")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ hasPossibleDuplicates: true, candidates: [{ score: 0.91, matchedFields: ["name"], customer: { ...baseClient, id: "duplicate-1", name: "Mercado La Aurora" } }] }) });
    if (path.endsWith("/customers")) {
      if (scenario.listDelay) await new Promise((resolve) => setTimeout(resolve, 10_000));
      const status = scenario.listStatus ?? 200;
      if (status !== 200) return route.fulfill({ status, contentType: "application/problem+json", body: JSON.stringify({ title: status === 403 ? "Prohibido" : "Error temporal", status }) });
      const noResults = scenario.empty || (scenario.noResultsOnSearch && url.searchParams.has("search"));
      const items = noResults ? [] : readyClients;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items, page: { page: 0, pageSize: 5, totalElements: noResults ? 0 : 128, totalPages: noResults ? 0 : 26 } }) });
    }
    if (path.endsWith("/territories")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [{ id: "territory-1", name: "Lima Centro", code: "LIM-CEN" }, { id: "territory-2", name: "Lima Norte", code: "LIM-NOR" }], page: { page: 0, pageSize: 100, totalElements: 2, totalPages: 1 } }) });
    if (path.endsWith("/sellers")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [{ id: "seller-1", displayName: "Lucía Calderón" }, { id: "seller-2", displayName: "Diego Luna" }], page: { page: 0, pageSize: 100, totalElements: 2, totalPages: 1 } }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(current) });
  });
}

async function openClients(page: Page, role: Role, width: number, height: number, scenario: Scenario = {}, waitForTable = true) {
  await page.clock.setFixedTime(new Date("2026-09-12T15:11:00-05:00"));
  await page.setViewportSize({ width, height });
  await mockClients(page, role, scenario);
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill("visual@example.test");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto(role === "SUPERVISOR" ? "/supervisor/clients" : "/company/clients");
  await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();
  if (waitForTable) await expect(page.getByRole("table", { name: "Clientes" })).toBeVisible();
}

for (const viewport of [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 850 },
  { name: "tablet", width: 900, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test(`clientes golden ${viewport.name}`, async ({ page }) => {
    await openClients(page, "COMPANY_ADMIN", viewport.width, viewport.height);
    await expect(page).toHaveScreenshot(`company-clients-${viewport.name}.png`, { animations: "disabled", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("clientes golden oscuro y supervisor readonly", async ({ page }) => {
  await openClients(page, "SUPERVISOR", 1440, 900);
  await expect(page.getByText("Consulta de solo lectura")).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear cliente" })).toHaveCount(0);
  await page.getByRole("button", { name: "Más acciones para Mercado Aurora" }).click();
  await expect(page.getByRole("menuitem", { name: "Ver cliente" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Editar cliente" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("switch", { name: "Modo oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page).toHaveScreenshot("company-clients-supervisor-dark.png", { animations: "disabled", fullPage: true });
});

for (const state of [
  { name: "empty", scenario: { empty: true }, heading: "Aún no hay clientes" },
  { name: "error", scenario: { listStatus: 500 }, heading: "Ocurrió un problema temporal" },
  { name: "forbidden", scenario: { listStatus: 403 }, heading: "No tienes permisos" },
] as const) {
  test(`clientes golden estado ${state.name}`, async ({ page }) => {
    await openClients(page, "COMPANY_ADMIN", 1440, 900, state.scenario, false);
    await expect(page.getByRole("heading", { name: state.heading })).toBeVisible();
    await expect(page).toHaveScreenshot(`company-clients-${state.name}.png`, { animations: "disabled", fullPage: true });
  });
}

test("clientes golden loading inicial", async ({ page }) => {
  await openClients(page, "COMPANY_ADMIN", 1440, 900, { listDelay: true }, false);
  await expect(page.getByRole("status", { name: "Cargando clientes" })).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-loading.png", { animations: "disabled", fullPage: true });
});

test("clientes golden filtros activos y sin resultados", async ({ page }) => {
  await openClients(page, "COMPANY_ADMIN", 1440, 900, { noResultsOnSearch: true });
  await page.getByRole("searchbox", { name: "Buscar por nombre o segmento" }).fill("sin coincidencias");
  await expect(page.getByRole("heading", { name: "No encontramos clientes" })).toBeVisible();
  await expect(page.getByText("Búsqueda: sin coincidencias")).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-no-results.png", { animations: "disabled", fullPage: true });
});

test("clientes golden filtros desplegados", async ({ page }) => {
  await openClients(page, "COMPANY_ADMIN", 1440, 900);
  await page.getByRole("button", { name: "Zona", exact: true }).click();
  await expect(page.getByRole("listbox", { name: "Zona" })).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-territory-filter.png", { animations: "disabled", fullPage: true });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sin visita desde", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Calendario de Sin visita desde" })).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-visit-date.png", { animations: "disabled", fullPage: true });
});

test("clientes golden menús, drawers y confirmación", async ({ page }) => {
  await openClients(page, "COMPANY_ADMIN", 1440, 900);
  await page.route("https://maps.geoapify.com/**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#f5f7fb" } }] }) }));
  const menuTrigger = page.getByRole("button", { name: "Más acciones para Mercado Aurora" });
  await menuTrigger.click();
  await expect(page.getByRole("menu", { name: "Acciones de Mercado Aurora" })).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-actions.png", { animations: "disabled", fullPage: true });
  await page.getByRole("menuitem", { name: "Ver cliente" }).click();
  await expect(page.getByRole("dialog", { name: "Detalle de cliente" })).toBeVisible();
  await expect(page.locator(".client-location-map__marker")).toBeAttached();
  await expect(page).toHaveScreenshot("company-clients-detail.png", { animations: "disabled", fullPage: true });
  await page.getByRole("button", { name: "Cerrar detalle" }).click();
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByRole("dialog", { name: "Crear cliente" })).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-create.png", { animations: "disabled", fullPage: true });
  await page.getByRole("button", { name: "Cerrar formulario" }).click();
  await menuTrigger.click();
  await page.getByRole("menuitem", { name: "Inactivar cliente" }).click();
  await expect(page.getByRole("alertdialog", { name: "Inactivar cliente" })).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-inactivate.png", { animations: "disabled", fullPage: true });
});

test("overlays compartidos permanecen dentro del viewport", async ({ page }) => {
  await openClients(page, "COMPANY_ADMIN", 390, 844);
  for (const label of ["Zona", "Sin visita desde"] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    const overlay = label === "Zona" ? page.getByRole("listbox", { name: label }) : page.getByRole("dialog", { name: `Calendario de ${label}` });
    const box = await overlay.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    await page.keyboard.press("Escape");
  }
});
