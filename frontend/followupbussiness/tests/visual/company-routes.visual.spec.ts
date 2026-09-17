import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Los casos de rutas capturan varios estados y mockups en una sola prueba.
test.setTimeout(90_000);

const desktop = { width: 1440, height: 900 };
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const evidenceRunId = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDirectory = path.join(repositoryRoot, "docs", "handoffs", "frontend", "FE-014-017-visual-evidence", evidenceRunId);
const mockupUrl = (name: string) => pathToFileURL(path.join(repositoryRoot, "docs", "frontendMockups", name)).href;
const mockups = {
  list: mockupUrl("FE-014.html"),
  manual: mockupUrl("FE-015.html"),
  automatic: mockupUrl("FE-016.html"),
  publish: mockupUrl("FE-017.html"),
} as const;

const sellerNorth = {
  id: "seller-north",
  displayName: "Diego Luna",
  status: "ACTIVE",
  territoryIds: ["territory-north"],
};
const sellerCenter = {
  id: "seller-center",
  displayName: "Sofía Ramos",
  status: "ACTIVE",
  territoryIds: ["territory-center"],
};
const sellerEast = {
  id: "seller-east",
  displayName: "Marco Ruiz",
  status: "ACTIVE",
  territoryIds: ["territory-east"],
};
const sellerSouth = { id: "seller-south", displayName: "Lucía Vega", status: "ACTIVE", territoryIds: ["territory-south"] };
const sellerWest = { id: "seller-west", displayName: "Bruno Díaz", status: "ACTIVE", territoryIds: ["territory-west"] };

const customers = [
  ["customer-brisa", "Mercado Brisa", -12.0464, -77.0428, "territory-north"],
  ["customer-sendero", "Librería Sendero", -12.055, -77.035, "territory-north"],
  ["customer-cauce", "Distribuidora Cauce", -12.062, -77.029, "territory-north"],
  ["customer-pinar", "Comercial Pinar", -12.071, -77.021, "territory-north"],
  ["customer-plaza", "Bodega Plaza", -12.064, -77.044, "territory-center"],
  ["customer-sol", "Farmacia Sol", -12.068, -77.037, "territory-center"],
] as const;
const portfolioCustomers = [
  ...customers,
  ...Array.from({ length: 122 }, (_, index) => [`customer-fixture-${index + 1}`, `Cliente de cartera ${String(index + 1).padStart(3, "0")}`, -12.08 - index / 10_000, -77.02 - index / 10_000, "territory-north"] as const),
] as const;

function points(entries: readonly (typeof customers)[number][]) {
  return entries.map(([customerId, customerName, latitude, longitude], index) => ({
    id: `point-${customerId}`,
    customerId,
    customerName,
    sequence: index + 1,
    status: "PENDING",
    location: { latitude, longitude },
  }));
}

const draft = {
  id: "route-north",
  name: "Ruta Norte 04",
  date: "2026-09-10",
  sellerId: sellerNorth.id,
  status: "DRAFT",
  points: points(customers.slice(0, 4)),
  updatedAt: "2026-09-10T12:00:00Z",
  version: 3,
};
const published = {
  id: "route-center",
  name: "Ruta Centro 02",
  date: "2026-09-10",
  sellerId: sellerCenter.id,
  status: "PUBLISHED",
  points: points(customers.slice(2, 6)),
  updatedAt: "2026-09-10T12:15:00Z",
  version: 1,
};
const inProgress = {
  id: "route-east",
  name: "Ruta Este 01",
  date: "2026-09-10",
  sellerId: sellerEast.id,
  status: "IN_PROGRESS",
  points: points(customers.slice(0, 3)),
  updatedAt: "2026-09-10T12:30:00Z",
  version: 2,
};
const completed = { id: "route-south", name: "Ruta Sur 06", date: "2026-09-10", sellerId: sellerSouth.id, status: "COMPLETED", points: points(customers.slice(0, 4)), updatedAt: "2026-09-10T12:45:00Z", version: 2 };
const cancelled = { id: "route-west", name: "Ruta Oeste 03", date: "2026-09-10", sellerId: sellerWest.id, status: "CANCELLED", points: points(customers.slice(1, 4)), updatedAt: "2026-09-10T13:00:00Z", version: 1 };
const routeItems = [draft, published, inProgress, completed, cancelled];
const pageInfo = { page: 0, pageSize: 20, totalElements: 100, totalPages: 5 };
const directions = {
  geometry: customers.slice(0, 4).map(([, , latitude, longitude]) => ({ latitude, longitude })),
  legs: customers.slice(1, 4).map(() => ({ distanceMeters: 4_600, durationSeconds: 960, instructions: [] })),
  distanceMeters: 18_400,
  durationSeconds: 2_880,
};

function identity() {
  return {
    channel: "WEB",
    credentials: { accessToken: "routes-visual-token", tokenType: "Bearer", expiresIn: 600 },
    csrfToken: "c".repeat(43),
    user: {
      id: "identity-routes-visual",
      displayName: "Alex Medina",
      email: "alex.medina@comercialandina.example",
      status: "ACTIVE",
      roles: ["COMPANY_ADMIN"],
      company: { id: "company-visual", legalName: "Comercial Andina" },
    },
  };
}

type RoutesResponseOverride = { status: number; body: unknown };
type OptimizeInput = { routeId: string; baseRouteVersion: number; visits: { customerId: string; serviceDurationSeconds: number; priority: number }[] };
type RouteVisualOverrides = Readonly<{ optimize?: (input: OptimizeInput) => RoutesResponseOverride | Promise<RoutesResponseOverride> }>;

async function openRoutes(page: Page, routesOverride?: RoutesResponseOverride, overrides?: RouteVisualOverrides) {
  const current = identity();
  const telemetry = { publishRequests: 0, optimizeRequests: 0, optimizeInputs: [] as OptimizeInput[] };
  let createdRoute = { ...draft, id: "route-created", name: "Ruta planificada", version: 1 };
  await page.route("https://maps.geoapify.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": route.request().url().includes("dark-matter") ? "#1c293d" : "#e9eff6" } }] }),
    });
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let status = 200;
    let body: unknown = current;
    if (path.endsWith("/me")) body = current.user;
    else if (path === "/api/routes" && request.method() === "GET") {
      if (routesOverride) {
        status = routesOverride.status;
        body = routesOverride.body;
      } else body = { items: routeItems, page: pageInfo };
    }
    else if (path === "/api/sellers") body = { items: [sellerNorth, sellerCenter, sellerEast, sellerSouth, sellerWest], page: { page: 0, pageSize: 20, totalElements: 5, totalPages: 1 } };
    else if (path === "/api/customers") body = { items: portfolioCustomers.map(([id, name, latitude, longitude, territoryId]) => ({ id, name, territoryId, location: { latitude, longitude } })), page: { ...pageInfo, totalElements: portfolioCustomers.length } };
    else if (path === "/api/routes/suggested-customers") body = { items: customers.slice(0, 3).map(([id, name, latitude, longitude, territoryId]) => ({ customer: { id, name, territoryId, location: { latitude, longitude } } })), page: { ...pageInfo, totalElements: 3 } };
    else if (path.endsWith("/directions") || path.endsWith("/directions/preview")) body = directions;
    else if (path.endsWith("/points/order")) {
      const currentRoute = path.includes(createdRoute.id) ? createdRoute : routeItems.find((item) => path.includes(item.id));
      const input = request.postDataJSON() as { routePointIds: string[] };
      const byId = new Map(currentRoute?.points.map((point) => [point.id, point]));
      body = { ...currentRoute, version: (currentRoute?.version ?? 0) + 1, points: input.routePointIds.flatMap((id, index) => { const point = byId.get(id); return point ? [{ ...point, sequence: index + 1 }] : []; }) };
      if (path.includes(createdRoute.id)) createdRoute = body as typeof createdRoute;
    }
    else if (path.endsWith("/publish")) { telemetry.publishRequests += 1; body = { ...draft, status: "PUBLISHED", version: 4 }; }
    else if (path === "/api/routes/optimize") {
      telemetry.optimizeRequests += 1;
      const input = request.postDataJSON() as OptimizeInput;
      telemetry.optimizeInputs.push(input);
      const override = overrides?.optimize ? await overrides.optimize(input) : null;
      if (override) { status = override.status; body = override.body; }
      else body = { routeId: input.routeId, proposalVersion: 1, baseRouteVersion: input.baseRouteVersion, published: false, orderedVisits: [...input.visits].reverse().map((visit, index) => ({ customerId: visit.customerId, sequence: index + 1 })), unassignedVisits: [], totalTravelSeconds: 2_880, totalServiceSeconds: input.visits.reduce((total, visit) => total + visit.serviceDurationSeconds, 0), totalDistanceMeters: 18_400, optimality: "OPTIMAL" };
    }
    else if (path === "/api/routes" && request.method() === "POST") {
      const input = request.postDataJSON() as { date: string; sellerId: string; visits: { customerId: string }[] };
      const customerById = new Map(customers.map((customer) => [customer[0], customer]));
      createdRoute = { ...draft, id: "route-created", name: "Ruta planificada", date: input.date, sellerId: input.sellerId, version: 1, points: input.visits.flatMap((visit, index) => { const customer = customerById.get(visit.customerId); return customer ? [{ id: `point-${customer[0]}`, customerId: customer[0], customerName: customer[1], sequence: index + 1, status: "PENDING", location: { latitude: customer[2], longitude: customer[3] } }] : []; }) };
      status = 201;
      body = createdRoute;
    }
    else {
      const detail = [...routeItems, createdRoute].find((item) => path.endsWith(`/routes/${item.id}`));
      if (detail) body = detail;
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill(current.user.email);
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto("/company/routes");
  await expect(page.getByRole("heading", { name: "Rutas", exact: true })).toBeVisible();
  if (!routesOverride || routesOverride.status < 400) {
    await expect(page.getByText("Ruta Norte 04", { exact: true })).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) > 760) await expect(page.getByText("Detalle vial disponible.").first()).toBeVisible({ timeout: 10_000 });
  }
  return telemetry;
}

async function configureBase(page: Page, mode: "Crear manualmente" | "Generar automáticamente") {
  await page.getByRole("button", { name: "Planificar ruta" }).click();
  await page.getByRole("button", { name: new RegExp(mode) }).click();
  await page.getByRole("button", { name: "Fecha operativa" }).click();
  await page.getByRole("button", { name: "Hoy", exact: true }).click();
  await page.getByRole("button", { name: "Vendedor de la ruta" }).click();
  await page.getByRole("option", { name: "Diego Luna" }).click();
  await page.getByRole("button", { name: "Continuar a clientes" }).click();
  await expect(page.getByText("Clientes disponibles")).toBeVisible();
}

async function setGoldenListFilters(page: Page) {
  // FE-014 `filters-active` represents seller and status chips.  Keeping the
  // date at its fixture value avoids comparing a different active-filter state.
  await page.getByRole("button", { name: "Vendedor", exact: true }).click();
  await page.getByRole("option", { name: "Diego Luna" }).click();
  await page.getByRole("button", { name: "Estado", exact: true }).click();
  await page.getByRole("option", { name: "Borrador" }).click();
}

async function addVisit(page: Page, customer: string, duration?: string) {
  await page.locator(".route-customer-results article").filter({ hasText: customer }).getByRole("button", { name: "Agregar" }).click();
  if (duration) await page.locator(".route-customer-pane--selected li").filter({ hasText: customer }).locator("input").fill(duration);
}

async function fillGoldenConstraints(page: Page) {
  await page.getByLabel("Inicio de jornada").fill("0800");
  await page.getByLabel("Fin de jornada").fill("1700");
  for (const [customer, minutes, priority] of [
    ["Mercado Brisa", "15", "Alta"],
    ["Librería Sendero", "20", "Media"],
    ["Distribuidora Cauce", "25", "Alta"],
    ["Comercial Pinar", "25", "Media"],
  ] as const) {
    const card = page.locator(".route-proposal-dialog__visit").filter({ hasText: customer });
    await card.getByLabel(/Duración estimada de la visita/).fill(minutes);
    await card.getByRole("button", { name: new RegExp(`Prioridad de ${customer}`) }).click();
    await page.getByRole("option", { name: priority }).click();
  }
  const first = page.locator(".route-proposal-dialog__visit").filter({ hasText: "Mercado Brisa" });
  await first.getByLabel("Inicio de ventana").fill("0900");
  await first.getByLabel("Fin de ventana").fill("1100");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

async function capture(page: Page, info: TestInfo, name: string) {
  await mkdir(evidenceDirectory, { recursive: true });
  const evidencePath = path.join(evidenceDirectory, `${name}-${info.retry}.png`);
  await page.screenshot({ path: evidencePath, fullPage: true, animations: "disabled" });
  await info.attach(name, { path: evidencePath, contentType: "image/png" });
}

async function compareBoxes(application: Page, reference: Page, applicationSelector: string, goldenSelector: string, label: string, tolerance = 24, applicationAnchor?: string, goldenAnchor?: string, comparePosition = true) {
  await expect(application.locator(applicationSelector).first(), `Región app ${label}`).toHaveCount(1, { timeout: 1_000 });
  await expect(reference.locator(goldenSelector).first(), `Región golden ${label}`).toHaveCount(1, { timeout: 1_000 });
  const [actual, expected, actualParent, expectedParent] = await Promise.all([application.locator(applicationSelector).first().boundingBox(), reference.locator(goldenSelector).first().boundingBox(), applicationAnchor ? application.locator(applicationAnchor).first().boundingBox() : Promise.resolve(null), goldenAnchor ? reference.locator(goldenAnchor).first().boundingBox() : Promise.resolve(null)]);
  expect(actual, `Región app ${label}`).not.toBeNull();
  expect(expected, `Región golden ${label}`).not.toBeNull();
  expect(Math.abs(actual!.width - expected!.width), `Ancho ${label}`).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual!.height - expected!.height), `Alto ${label}`).toBeLessThanOrEqual(tolerance);
  if (comparePosition) {
    expect(Math.abs((actual!.x - (actualParent?.x ?? 0)) - (expected!.x - (expectedParent?.x ?? 0))), `Posición horizontal ${label}`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs((actual!.y - (actualParent?.y ?? 0)) - (expected!.y - (expectedParent?.y ?? 0))), `Posición vertical ${label}`).toBeLessThanOrEqual(tolerance);
  }
}

async function expectSameStableStyle(application: Page, reference: Page, applicationSelector: string, goldenSelector: string, properties: readonly string[], label: string) {
  const [actual, expected] = await Promise.all([
    application.locator(applicationSelector).first().evaluate((element, names) => Object.fromEntries(names.map((name) => [name, getComputedStyle(element).getPropertyValue(name)])), properties),
    reference.locator(goldenSelector).first().evaluate((element, names) => Object.fromEntries(names.map((name) => [name, getComputedStyle(element).getPropertyValue(name)])), properties),
  ]);
  expect(actual, `Estilos estables de ${label}`).toEqual(expected);
}

async function expectFe014DetailRegions(application: Page, reference: Page, verifyPointCount = true) {
  const closeButton = application.getByRole("button", { name: "Cerrar detalle" });
  await expect(closeButton).toBeFocused();
  await expectSameStableStyle(application, reference, ".route-detail-drawer .shared-modal-header__close", ".detail-drawer .drawer-head .btn-icon", ["width", "height", "border-top-width", "border-top-color", "border-radius", "box-shadow"], "cierre enfocado del drawer FE-014");
  await expect(application.locator(".route-detail-hero p")).toHaveText("Planificación del 10 de septiembre de 2026");
  await compareBoxes(application, reference, ".route-detail-summary", ".routes-definition", "resumen FE-014", 4, ".drawer-surface__body", ".drawer-body");
  await expect(application.locator(".route-detail-summary > div")).toHaveCount(5);
  const summaryColumns = await application.locator(".route-detail-summary").evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
  expect(summaryColumns, "El resumen FE-014 conserva tres columnas").toBe(3);
  await expectSameStableStyle(application, reference, ".route-detail-summary", ".routes-definition", ["grid-template-columns"], "resumen FE-014");

  const appCards = application.locator(".route-detail__points > li");
  const goldenCards = reference.locator(".sequence-timeline > li");
  if (verifyPointCount) await expect(appCards).toHaveCount(await goldenCards.count());
  else expect(await appCards.count(), "La secuencia FE-014 contiene visitas contractuales").toBeGreaterThan(0);
  for (let index = 0; index < Math.min(await appCards.count(), await goldenCards.count()); index += 1) {
    await compareBoxes(application, reference, `.route-detail__points > li:nth-child(${index + 1})`, `.sequence-timeline > li:nth-child(${index + 1})`, `tarjeta de visita FE-014 ${index + 1}`, 4, ".route-detail__points", ".sequence-timeline");
  }
  await expectSameStableStyle(application, reference, ".route-detail__points > li", ".sequence-timeline > li", ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-radius", "background-color"], "tarjetas de visita FE-014");

  await expect(application.locator(".route-read-only-sequence__map > summary strong")).toHaveText("Vista previa del recorrido");
  await expect(application.locator(".route-read-only-sequence__map-status")).toHaveText("Detalle vial");
  await compareBoxes(application, reference, ".route-read-only-sequence__map", ".detail-map-preview", "cabecera de mapa FE-014", 4, undefined, undefined, false);
  await expectSameStableStyle(application, reference, ".route-read-only-sequence__map", ".detail-map-preview", ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-radius", "background-color"], "previsualización de mapa FE-014");
}

async function expectFe014ModeRegions(application: Page, reference: Page) {
  const firstMode = application.getByRole("button", { name: /Crear manualmente/ });
  await expect(firstMode).toBeFocused();
  await expect(firstMode).toHaveAttribute("aria-pressed", "true");
  await expectSameStableStyle(application, reference, ".route-mode-grid > button:first-child", ".mode-card:first-child", ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "box-shadow"], "foco de modo FE-014");
  await expectSameStableStyle(application, reference, ".route-mode-dialog .shared-modal-header__close", ".mode-dialog .dialog-head a", ["width", "height", "border-radius", "border-top-color", "background-color"], "cierre de modo FE-014");
  await expect(application.locator('[data-route-mode-icon="route"]')).toHaveCount(1);
  await expect(application.locator('[data-route-mode-icon="activity"]')).toHaveCount(1);
  for (const icon of ["route", "activity"] as const) {
    const locator = application.locator(`[data-route-mode-icon="${icon}"]`);
    await expect(locator).toHaveAttribute("width", "20");
    await expect(locator).toHaveAttribute("height", "20");
    await expect(locator).toHaveAttribute("stroke-width", "1.8");
  }
  await expectSameStableStyle(application, reference, '[data-route-mode-icon="route"]', ".mode-card:first-child .mode-icon svg", ["width", "height", "stroke-width"], "geometría de icono de modo FE-014");
  await expect(application.locator('[data-route-mode-icon="route"] path')).toHaveAttribute("d", "M8 18h4a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H8M8 8 6 6l2-2");
  await expect(application.locator('[data-route-mode-icon="activity"] path')).toHaveAttribute("d", "M3 12h4l2.5-6 5 12 2.5-6h4");
  for (let index = 0; index < 2; index += 1) {
    const [applicationCard, applicationCta, goldenCard, goldenCta] = [application.locator(".route-mode-grid > button").nth(index), application.locator(".route-mode-grid > button b").nth(index), reference.locator(".mode-card").nth(index), reference.locator(".mode-card .mode-cta").nth(index)];
    const [actualCard, actualCta, expectedCard, expectedCta] = await Promise.all([applicationCard.boundingBox(), applicationCta.boundingBox(), goldenCard.boundingBox(), goldenCta.boundingBox()]);
    expect(actualCard).not.toBeNull(); expect(actualCta).not.toBeNull(); expect(expectedCard).not.toBeNull(); expect(expectedCta).not.toBeNull();
    const actualBottomGap = actualCard!.y + actualCard!.height - (actualCta!.y + actualCta!.height);
    const expectedBottomGap = expectedCard!.y + expectedCard!.height - (expectedCta!.y + expectedCta!.height);
    expect(Math.abs(actualBottomGap - expectedBottomGap), `CTA ${index + 1} alineada al borde inferior FE-014`).toBeLessThanOrEqual(4);
    await expectSameStableStyle(application, reference, `.route-mode-grid > button:nth-child(${index + 1})`, `.mode-card:nth-child(${index + 1})`, ["background-color"], `superficie de tarjeta de modo ${index + 1} FE-014`);
  }
}

async function compare(page: Page, info: TestInfo, name: string, mockup: keyof typeof mockups, state: string, dark = false) {
  const size = page.viewportSize();
  if (size === null) throw new Error("El viewport visual debe estar definido.");
  await page.evaluate(() => window.scrollTo(0, 0));
  const reference = await page.context().newPage();
  await reference.setViewportSize(size);
  await reference.goto(`${mockups[mockup]}?state=${state}${dark ? "&theme=dark" : ""}`);
  await reference.addStyleTag({ content: ".topbar,.app-topbar,.sidebar,.app-sidebar,[class*='topbar'],[class*='sidebar']{visibility:hidden}" });
  const overlay = state.startsWith("detail-") || state === "choose-mode";
  const applicationLocator = page.locator(overlay ? "[role=dialog]" : ".routes-page, .route-page-workflow").first();
  const goldenLocator = reference.locator(state === "choose-mode" ? ".mode-dialog" : overlay ? ".detail-drawer" : ".app-main .page").first();
  const applicationRegion = await applicationLocator.boundingBox();
  const goldenRegion = await goldenLocator.boundingBox();
  if (!applicationRegion || !goldenRegion) throw new Error(`No se encontró la región visual de ${name}.`);
  if (overlay) await compareBoxes(page, reference, "[role=dialog]", state === "choose-mode" ? ".mode-dialog" : ".detail-drawer", name, 24);
  if (mockup === "list" && state === "filters-active") {
    await compareBoxes(page, reference, ".route-filters", ".routes-filterbar", "filtros FE-014", 28, ".routes-page", ".app-main .page");
    await compareBoxes(page, reference, ".route-card", ".route-card", "tarjeta FE-014", 32, ".route-card-list", ".route-list-cards");
    await compareBoxes(page, reference, ".route-rail__footer", ".route-rail-foot", "footer FE-014", 32, undefined, undefined, false);
    await compareBoxes(page, reference, ".data-table__pagination", ".pagination", "paginador FE-014", 28, ".route-rail__footer", ".route-rail-foot");
  }
  if (mockup === "manual" && state === "manual-order") {
    await compareBoxes(page, reference, ".route-stepper", ".workflow-stepper:visible", "stepper FE-015", 28, ".route-planning", ".workflow-card");
    if (size.width > 760) {
      await compareBoxes(page, reference, ".route-manual-order-layout", ".planner-layout", "paneles FE-015", 36, ".route-planning", ".workflow-card");
    } else {
      await expect(page.locator(".route-manual-order-layout--mobile-list .route-order-editor__visits")).toBeVisible();
      await expect(page.locator(".route-manual-order-layout--mobile-list .route-sequence-map")).toBeHidden();
    }
  }
  const width = Math.floor(Math.min(applicationRegion.width, goldenRegion.width));
  const height = Math.floor(Math.min(applicationRegion.height, goldenRegion.height, size.height));
  expect(Math.abs(applicationRegion.width - goldenRegion.width) / goldenRegion.width, `Ancho de región de ${name}`).toBeLessThan(0.25);
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
  for (const [region] of [["superior", applicationRegion.y, goldenRegion.y], ["inferior", applicationRegion.y + Math.max(0, applicationRegion.height - height), goldenRegion.y + Math.max(0, goldenRegion.height - height)]] as const) {
    const [application, golden] = await Promise.all([applicationLocator.screenshot({ animations: "disabled" }), goldenLocator.screenshot({ animations: "disabled" })]);
    const sheet = await page.context().newPage();
    await sheet.setViewportSize({ width: width * 2 + 2, height });
    await sheet.setContent(`<style>body{margin:0;background:#111827}main{display:grid;grid-template-columns:repeat(2,${width}px);gap:2px}img{width:${width}px;height:${height}px;object-fit:cover;object-position:${region === "inferior" ? "bottom" : "top"}}</style><main><img alt="Aplicación ${region}" src="data:image/png;base64,${application.toString("base64")}"><img alt="Mockup ${region}" src="data:image/png;base64,${golden.toString("base64")}"></main>`);
    const comparisonPath = info.outputPath(`comparativo-${region}-${name}-${width}x${height}.png`);
    await sheet.screenshot({ path: comparisonPath, animations: "disabled" });
    await mkdir(evidenceDirectory, { recursive: true });
    await sheet.screenshot({ path: path.join(evidenceDirectory, `${region}-${name}-${width}x${height}.png`), animations: "disabled" });
    await info.attach(`comparativo-${region}-${name}`, { path: comparisonPath, contentType: "image/png" });
    await sheet.close();
  }
  await reference.close();
}

async function captureLowerComparison(page: Page, info: TestInfo, name: string, mockup: keyof typeof mockups, state: string, dark = false) {
  const size = page.viewportSize();
  if (!size) throw new Error("El viewport visual debe estar definido.");
  const reference = await page.context().newPage();
  await reference.setViewportSize(size);
  await reference.goto(`${mockups[mockup]}?state=${state}${dark ? "&theme=dark" : ""}`);
  const application = page.locator(".route-publish-layout > details.route-publish-map[open]");
  const golden = reference.locator(".publish-layout > .publish-map-details[open]");
  await expect(application).toBeVisible();
  await expect(golden).toBeVisible();
  const [actual, expected] = await Promise.all([application.screenshot({ animations: "disabled" }), golden.screenshot({ animations: "disabled" })]);
  const width = Math.max((await application.boundingBox())?.width ?? 0, (await golden.boundingBox())?.width ?? 0);
  const height = Math.max((await application.boundingBox())?.height ?? 0, (await golden.boundingBox())?.height ?? 0);
  const sheet = await page.context().newPage();
  await sheet.setViewportSize({ width: Math.ceil(width * 2 + 2), height: Math.ceil(height) });
  await sheet.setContent(`<style>body{margin:0;background:#111827}main{display:grid;grid-template-columns:repeat(2,${Math.ceil(width)}px);gap:2px}img{width:${Math.ceil(width)}px;height:${Math.ceil(height)}px;object-fit:cover;object-position:top}</style><main><img alt="Aplicación inferior" src="data:image/png;base64,${actual.toString("base64")}"><img alt="Mockup inferior" src="data:image/png;base64,${expected.toString("base64")}"></main>`);
  const comparisonPath = info.outputPath(`comparativo-inferior-${name}.png`);
  await sheet.screenshot({ path: comparisonPath, animations: "disabled" });
  await mkdir(evidenceDirectory, { recursive: true });
  await sheet.screenshot({ path: path.join(evidenceDirectory, `inferior-${name}.png`), animations: "disabled" });
  await info.attach(`comparativo-inferior-${name}`, { path: comparisonPath, contentType: "image/png" });
  await reference.close();
  await sheet.close();
}

async function expectWorkspaceGeometry(page: Page) {
  const map = await page.locator(".route-map-region").boundingBox();
  const rail = await page.locator(".route-rail").boundingBox();
  const footer = await page.locator(".route-rail__footer").boundingBox();
  const viewport = page.viewportSize();
  expect(map).not.toBeNull();
  expect(rail).not.toBeNull();
  expect(footer).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(map!.width).toBeGreaterThan(rail!.width * 1.25);
  expect(Math.abs(map!.y + map!.height - (rail!.y + rail!.height))).toBeLessThanOrEqual(2);
  expect(Math.abs((footer!.y + footer!.height) - (rail!.y + rail!.height))).toBeLessThanOrEqual(2);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(viewport!.height + 1);
  await expect(page.locator(".route-map-region > .route-sequence-map--embedded")).toBeVisible();
  await expect(page.locator(".route-map-region > .route-sequence-map--card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Registros por página" })).toHaveCount(0);
}

test("FE-014 selector de modo conserva superficie y CTA golden", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.getByRole("button", { name: "Planificar ruta" }).click();
  const reference = await page.context().newPage();
  await reference.setViewportSize(desktop);
  await reference.goto(`${mockups.manual}?state=choose-mode`);
  await expectFe014ModeRegions(page, reference);
  await capture(page, info, "fe-014-choose-mode-surface");
  await reference.close();
});

test("FE-014 listado y flujos principales comparados con los mockups", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await expectWorkspaceGeometry(page);
  await setGoldenListFilters(page);
  await compare(page, info, "fe-014-filters-active", "list", "filters-active");

  await page.getByRole("button", { name: "Ver detalle" }).click();
  const drawer = page.getByRole("dialog", { name: "Detalle de ruta" });
  await expect(drawer.getByText("Mercado Brisa")).toBeVisible();
  const drawerBox = await drawer.boundingBox();
  const headerBox = await drawer.locator(".drawer-surface__header").boundingBox();
  const footerBox = await drawer.locator(".drawer-surface__footer").boundingBox();
  const sequenceBox = await drawer.locator(".route-read-only-sequence__visits").boundingBox();
  const mapPreviewBox = await drawer.locator(".route-read-only-sequence__map").boundingBox();
  expect(drawerBox).not.toBeNull(); expect(headerBox).not.toBeNull(); expect(footerBox).not.toBeNull(); expect(sequenceBox).not.toBeNull(); expect(mapPreviewBox).not.toBeNull();
  expect(drawerBox!.width).toBeLessThanOrEqual(580);
  expect(headerBox!.y).toBeGreaterThanOrEqual(0);
  expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(desktop.height + 1);
  expect(mapPreviewBox!.y).toBeGreaterThan(sequenceBox!.y);
  const goldenDetailPage = await page.context().newPage();
  await goldenDetailPage.setViewportSize(desktop);
  await goldenDetailPage.goto(`${mockups.list}?state=detail-draft`);
  await expectFe014DetailRegions(page, goldenDetailPage);
  await goldenDetailPage.close();
  await compare(page, info, "fe-014-detail-draft", "list", "detail-draft");
  await page.getByRole("button", { name: "Cerrar detalle" }).click();

  await page.getByRole("button", { name: "Planificar ruta" }).click();
  await expect(page.getByRole("dialog", { name: "Planificar ruta" })).toBeVisible();
  const appMode = await page.getByRole("dialog", { name: "Planificar ruta" }).boundingBox();
  const goldenModePage = await page.context().newPage();
  await goldenModePage.setViewportSize(desktop);
  await goldenModePage.goto(`${mockups.manual}?state=choose-mode`);
  const goldenMode = await goldenModePage.locator(".mode-dialog").boundingBox();
  expect(appMode).not.toBeNull(); expect(goldenMode).not.toBeNull();
  expect(Math.abs(appMode!.width - goldenMode!.width)).toBeLessThanOrEqual(24);
  expect(Math.abs(appMode!.height - goldenMode!.height)).toBeLessThanOrEqual(32);
  expect(Math.abs(appMode!.x - goldenMode!.x)).toBeLessThanOrEqual(24);
  expect(Math.abs(appMode!.y - goldenMode!.y)).toBeLessThanOrEqual(24);
  await expectFe014ModeRegions(page, goldenModePage);
  await goldenModePage.close();
  await compare(page, info, "fe-014-choose-mode", "manual", "choose-mode");
  await capture(page, info, "fe-015-choose-mode");
  await page.getByRole("button", { name: "Cerrar modal" }).click();

  await configureBase(page, "Crear manualmente");
  await addVisit(page, "Mercado Brisa", "900");
  await addVisit(page, "Librería Sendero", "1200");
  await addVisit(page, "Distribuidora Cauce", "900");
  await addVisit(page, "Comercial Pinar", "1200");
  await page.getByRole("button", { name: "Continuar a orden y mapa" }).click();
  await expect(page.getByRole("heading", { name: "Crear ruta manual" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Clientes disponibles")).toBeVisible();
  await expect(page.getByText("Secuencia actual")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mapa de ubicaciones" })).toBeVisible();
  await compare(page, info, "fe-015-manual-order", "manual", "manual-order");
  await page.getByRole("button", { name: "Volver a rutas" }).click();

  await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click();
  await page.getByRole("menuitem", { name: "Generar propuesta" }).click();
  await expect(page.getByRole("heading", { name: "Generar propuesta automática" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await fillGoldenConstraints(page);
  await compare(page, info, "fe-016-automatic-constraints", "automatic", "automatic-constraints");
  const changeMode = page.locator(".route-page-workflow > header").getByRole("button", { name: "Cambiar modo" });
  await expect(changeMode).toBeVisible();
  await expect(page.locator(".route-proposal-dialog__form > footer").getByRole("button", { name: "Guardar y salir" })).toBeVisible();
  await changeMode.click();
  const modeDialog = page.getByRole("dialog", { name: "Planificar ruta" });
  await expect(modeDialog).toBeVisible();
  await modeDialog.getByRole("button", { name: "Cerrar" }).click();

  await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click();
  await page.getByRole("menuitem", { name: "Publicar ruta" }).click();
  await expect(page.getByRole("heading", { name: "Revisar y publicar ruta" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await compare(page, info, "fe-017-publish-review", "publish", "publish-review");
});

test("FE-015 orden publicado conserva advertencia y acciones contractuales", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.locator(".route-card").filter({ hasText: "Ruta Centro 02" }).locator(".route-card__select").click();
  await page.getByRole("button", { name: "Editar orden" }).click();
  await expect(page.getByText("La modificación notificará al vendedor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar orden y notificar" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".route-page-workflow").getByText("Detalle vial disponible.")).toBeVisible({ timeout: 10_000 });
  await compare(page, info, "fe-015-published-order-warning", "manual", "published-order-warning");
});

test("FE-014 expone filtros y acciones por estado sin ocultar la lectura", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.getByRole("button", { name: "Vendedor", exact: true }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Diego Luna" })).toBeVisible();
  await capture(page, info, "fe-014-vendedor-abierto");
  await page.getByRole("button", { name: "Vendedor", exact: true }).click();
  await page.getByRole("button", { name: "Estado", exact: true }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Borrador" })).toBeVisible();
  await capture(page, info, "fe-014-estado-abierto");
  await page.getByRole("button", { name: "Estado", exact: true }).click();
  await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click();
  await expect(page.getByRole("menuitem", { name: "Generar propuesta" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Publicar ruta" })).toBeVisible();
  await capture(page, info, "fe-014-menu-draft");
  await page.keyboard.press("Escape");
  await page.locator(".route-card").filter({ hasText: "Ruta Centro 02" }).getByRole("button", { name: "Acciones de Ruta Centro 02" }).click();
  await expect(page.getByRole("menuitem", { name: "Editar orden" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Publicar ruta" })).toHaveCount(0);
  await capture(page, info, "fe-014-menu-published");
  await page.keyboard.press("Escape");
  await page.locator(".route-card").filter({ hasText: "Ruta Este 01" }).getByRole("button", { name: "Acciones de Ruta Este 01" }).click();
  await expect(page.getByRole("menuitem", { name: "Ver detalle" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Editar orden" })).toHaveCount(0);
  await capture(page, info, "fe-014-menu-readonly");
});

test("FE-014 conserva datos previos ante error y muestra el vacío sin filtros", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.route("**/api/routes**", async (route) => { await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({}) }); });
  await page.getByRole("button", { name: "Vendedor", exact: true }).click();
  await page.getByRole("option", { name: "Diego Luna" }).click();
  await expect(page.getByText("No pudimos actualizar las rutas")).toBeVisible();
  await expect(page.getByText("Ruta Norte 04", { exact: true })).toBeVisible();
  await capture(page, info, "fe-014-stale-error");
  await page.unroute("**/api/routes**");
  await page.route("**/api/routes**", async (route) => { await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], page: { ...pageInfo, totalElements: 0, totalPages: 0 } }) }); });
  await page.getByRole("button", { name: "Estado", exact: true }).click();
  await page.getByRole("option", { name: "Borrador" }).click();
  await expect(page.getByText("No encontramos rutas")).toBeVisible();
  await capture(page, info, "fe-014-no-results");
  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
  await expect(page.getByText("Aún no hay rutas")).toBeVisible();
  await capture(page, info, "fe-014-empty");
});

test("FE-014 informa actualización en curso sin vaciar el rail", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  let releaseResponse: () => void = () => undefined;
  const responsePending = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route("**/api/routes**", async (route) => {
    await responsePending;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: routeItems, page: pageInfo }) });
  });
  await page.getByRole("button", { name: "Vendedor", exact: true }).click();
  const routesRequested = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/routes");
  await page.getByRole("option", { name: "Diego Luna" }).click();
  await routesRequested;
  await expect(page.getByText("Actualizando sin ocultar la última información disponible.")).toBeVisible();
  await expect(page.getByText("Ruta Norte 04", { exact: true })).toBeVisible();
  await capture(page, info, "fe-014-refreshing");
  releaseResponse();
  await expect(page.getByText("Actualizando sin ocultar la última información disponible.")).toHaveCount(0);
});

test("FE-014 muestra prohibido desde la consulta inicial", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page, { status: 403, body: {} });
  await expect(page.getByText("No tienes permisos")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  await capture(page, info, "fe-014-forbidden");
});

test("FE-014 muestra detalle publicado editable y solo lectura", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.locator(".route-card").filter({ hasText: "Ruta Centro 02" }).locator(".route-card__select").click();
  await page.getByRole("button", { name: "Ver detalle" }).click();
  await expect(page.getByRole("dialog", { name: "Detalle de ruta" }).getByRole("button", { name: "Editar orden" })).toBeVisible();
  const publishedGolden = await page.context().newPage();
  await publishedGolden.setViewportSize(desktop);
  await publishedGolden.goto(`${mockups.list}?state=detail-published-editable`);
  await expectFe014DetailRegions(page, publishedGolden);
  await publishedGolden.close();
  await compare(page, info, "fe-014-detail-published-editable", "list", "detail-published-editable");
  await capture(page, info, "fe-014-detail-published-editable");
  await page.getByRole("button", { name: "Cerrar detalle" }).click();
  await page.locator(".route-card").filter({ hasText: "Ruta Este 01" }).locator(".route-card__select").click();
  await page.getByRole("button", { name: "Ver detalle" }).click();
  await expect(page.getByRole("dialog", { name: "Detalle de ruta" }).getByRole("button", { name: "Editar orden" })).toHaveCount(0);
  const readonlyGolden = await page.context().newPage();
  await readonlyGolden.setViewportSize(desktop);
  await readonlyGolden.goto(`${mockups.list}?state=detail-readonly`);
  await expectFe014DetailRegions(page, readonlyGolden, false);
  await readonlyGolden.close();
  await compare(page, info, "fe-014-detail-readonly", "list", "detail-readonly");
  await capture(page, info, "fe-014-detail-readonly");
});

test("FE-015 recorre creación manual completa y conserva el orden en DRAFT", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  const telemetry = await openRoutes(page);
  await page.getByRole("button", { name: "Planificar ruta" }).click();
  await page.getByRole("button", { name: /Crear manualmente/ }).click();
  await expect(page.getByRole("heading", { name: "Crear ruta manual" })).toBeVisible();
  await expect(page.locator(".route-stepper")).toContainText("Datos base");
  await capture(page, info, "fe-015-manual-base");
  await page.getByRole("button", { name: "Fecha operativa" }).click();
  await page.getByRole("button", { name: "Hoy", exact: true }).click();
  await page.getByRole("button", { name: "Vendedor de la ruta" }).click();
  await page.getByRole("option", { name: "Diego Luna" }).click();
  await page.getByRole("button", { name: "Continuar a clientes" }).click();
  await expect(page.getByText("Clientes disponibles")).toBeVisible();
  await capture(page, info, "fe-015-manual-customers");
  await addVisit(page, "Mercado Brisa", "900");
  await addVisit(page, "Librería Sendero", "1200");
  await page.getByRole("button", { name: "Continuar a orden y mapa" }).click();
  await expect(page.getByText("Secuencia actual")).toBeVisible();
  await capture(page, info, "fe-015-manual-order-e2e");
  await page.getByRole("button", { name: "Bajar Mercado Brisa" }).click();
  await page.getByRole("button", { name: "Revisar borrador" }).click();
  await expect(page.getByRole("region", { name: "Revisión del borrador manual" })).toBeVisible();
  await capture(page, info, "fe-015-manual-review");
  await page.getByRole("button", { name: "Guardar como borrador" }).click();
  await expect(page.getByRole("heading", { name: "Borrador guardado" })).toBeVisible();
  expect(telemetry.publishRequests).toBe(0);
  await capture(page, info, "fe-015-manual-success-e2e");
});

test("FE-015 bloquea el avance manual sin datos requeridos", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.getByRole("button", { name: "Planificar ruta" }).click();
  await page.getByRole("button", { name: /Crear manualmente/ }).click();
  await expect(page.getByRole("button", { name: "Continuar a clientes" })).toBeDisabled();
  await capture(page, info, "fe-015-manual-base-validation");
  await page.getByRole("button", { name: "Fecha operativa" }).click();
  await page.getByRole("button", { name: "Hoy", exact: true }).click();
  await page.getByRole("button", { name: "Vendedor de la ruta" }).click();
  await page.getByRole("option", { name: "Diego Luna" }).click();
  await page.getByRole("button", { name: "Continuar a clientes" }).click();
  await expect(page.getByRole("button", { name: "Continuar a orden y mapa" })).toBeDisabled();
  await capture(page, info, "fe-015-manual-customers-validation");
});

test("FE-015 orden manual móvil mantiene la lista y los marcadores", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoutes(page);
  await configureBase(page, "Crear manualmente");
  await addVisit(page, "Mercado Brisa", "900");
  await addVisit(page, "Librería Sendero", "1200");
  await page.getByRole("button", { name: "Continuar a orden y mapa" }).click();
  await expect(page.getByText("Secuencia actual")).toBeVisible();
  const viewToggle = page.getByLabel("Alternar vista del orden manual");
  await expect(viewToggle.getByRole("button", { name: "Secuencia", exact: true })).toHaveAttribute("aria-pressed", "true");
  await viewToggle.getByRole("button", { name: "Mapa", exact: true }).click();
  await expect(page.locator(".route-page-workflow .route-sequence-map__marker")).toHaveText(["1", "2"]);
  await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await capture(page, info, "fe-015-manual-mobile-order");
});

test("FE-015 conserva el borrador visible mientras se guarda", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  let releaseSave: () => void = () => undefined;
  const savePending = new Promise<void>((resolve) => { releaseSave = resolve; });
  await page.route("**/api/routes", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await savePending;
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ...draft, id: "route-created", name: "Ruta planificada" }) });
  });
  await configureBase(page, "Crear manualmente");
  await addVisit(page, "Mercado Brisa", "900");
  await addVisit(page, "Librería Sendero", "1200");
  await page.getByRole("button", { name: "Continuar a orden y mapa" }).click();
  await page.getByRole("button", { name: "Revisar borrador" }).click();
  await page.getByRole("button", { name: "Guardar como borrador" }).click();
  await expect(page.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  await expect(page.getByRole("region", { name: "Revisión del borrador manual" })).toBeVisible();
  await capture(page, info, "fe-015-manual-saving");
  releaseSave();
  await expect(page.getByRole("heading", { name: "Borrador guardado" })).toBeVisible();
  await capture(page, info, "fe-015-manual-saved");
});

test("FE-015 conserva el orden publicado durante guardado y confirma éxito", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  let releaseSave: () => void = () => undefined;
  const savePending = new Promise<void>((resolve) => { releaseSave = resolve; });
  await page.route("**/points/order", async (route) => {
    await savePending;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...published, version: 2 }) });
  });
  await page.locator(".route-card").filter({ hasText: "Ruta Centro 02" }).locator(".route-card__select").click();
  await page.getByRole("button", { name: "Editar orden" }).click();
  await page.getByRole("button", { name: "Guardar orden y notificar" }).click();
  await expect(page.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  await expect(page.getByText("La modificación notificará al vendedor")).toBeVisible();
  await capture(page, info, "fe-015-published-order-saving");
  releaseSave();
  await expect(page.getByRole("heading", { name: "Orden actualizado" })).toBeVisible();
  await capture(page, info, "fe-015-published-order-success");
});

test("FE-015 conserva la intención local ante conflicto de orden", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.route("**/points/order", async (route) => {
    await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "VERSION_CONFLICT" }) });
  });
  await page.locator(".route-card").filter({ hasText: "Ruta Norte 04" }).locator(".route-card__select").click();
  await page.getByRole("button", { name: "Editar orden" }).click();
  await page.getByRole("button", { name: "Guardar orden" }).click();
  await expect(page.getByText("La ruta cambió mientras editabas")).toBeVisible();
  await expect(page.getByRole("alert").getByText("La versión cambió. Conservamos tu intención local; revisa y confirma nuevamente.")).toBeVisible();
  await capture(page, info, "fe-015-order-conflict");
});

test("FE-017 confirma, mantiene ocupado y muestra éxito de publicación", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  let release: (() => void) | undefined;
  await page.route("**/publish", async (route) => { await new Promise<void>((resolve) => { release = resolve; }); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...draft, status: "PUBLISHED", version: 4 }) }); });
  await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click(); await page.getByRole("menuitem", { name: "Publicar ruta" }).click();
  await expect(page.getByText("Orden final de visitas")).toBeVisible(); await capture(page, info, "fe-017-publish-review");
  await page.getByRole("button", { name: "Continuar a confirmación" }).click(); await expect(page.getByRole("alertdialog", { name: "Confirmar publicación" })).toBeVisible(); await capture(page, info, "fe-017-publish-confirmation");
  await page.getByRole("button", { name: "Confirmar publicación" }).click(); await expect(page.getByRole("button", { name: "Publicando…" })).toBeDisabled(); await capture(page, info, "fe-017-publishing");
  release?.(); await expect(page.getByRole("heading", { name: "Ruta publicada" })).toBeVisible(); await capture(page, info, "fe-017-publish-success");
});

test("FE-017 conserva la revisión ante conflicto de publicación", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoutes(page);
  await page.route("**/publish", async (route) => { await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "VERSION_CONFLICT" }) }); });
  await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click(); await page.getByRole("menuitem", { name: "Publicar ruta" }).click();
  await page.getByRole("button", { name: "Continuar a confirmación" }).click(); await page.getByRole("button", { name: "Confirmar publicación" }).click();
  await expect(page.getByText("La versión de la ruta cambió")).toBeVisible(); await expect(page.getByRole("button", { name: "Cargar versión actual" })).toBeVisible();
  await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await capture(page, info, "fe-017-publish-conflict-mobile");
});

test("FE-017 muestra validación y error del servidor sin perder la revisión", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.route("**/publish", async (route) => { await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ code: "VALIDATION_FAILED" }) }); });
  await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click(); await page.getByRole("menuitem", { name: "Publicar ruta" }).click();
  await page.getByRole("button", { name: "Continuar a confirmación" }).click(); await page.getByRole("button", { name: "Confirmar publicación" }).click();
  await expect(page.getByText("No pudimos publicar la ruta")).toBeVisible(); await expect(page.getByText("no cumple las condiciones", { exact: false })).toBeVisible(); await expect(page.getByText("Orden final de visitas")).toBeVisible();
  await capture(page, info, "fe-017-publish-validation-error");
});

test("FE-016 recorre propuesta, ajuste manual y guardado sin publicar", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  const telemetry = await openRoutes(page);
  await configureBase(page, "Generar automáticamente");
  await addVisit(page, "Mercado Brisa");
  await addVisit(page, "Librería Sendero");
  await page.getByRole("button", { name: "Continuar a restricciones" }).click();
  await expect(page.getByRole("heading", { name: "Restricciones para la propuesta" })).toBeVisible();
  await page.getByLabel("Inicio de jornada").fill("0800");
  await page.getByLabel("Fin de jornada").fill("1700");
  for (const visit of ["Mercado Brisa", "Librería Sendero"]) {
    const card = page.locator(".route-proposal-dialog__visit").filter({ hasText: visit });
    await card.getByLabel(/Duración estimada de la visita/).fill("30");
    await card.getByRole("button", { name: new RegExp(`Prioridad de ${visit}`) }).click();
    await page.getByRole("option", { name: "Media" }).click();
  }
  await page.getByRole("button", { name: "Generar propuesta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Revisar propuesta automática" })).toBeVisible();
  expect(telemetry.optimizeRequests).toBe(1);
  await expect(page.getByText("Óptimo")).toBeVisible();
  await capture(page, info, "fe-016-proposal-optimal");
  await page.getByRole("button", { name: "Bajar Librería Sendero" }).click();
  await expect(page.getByText("Propuesta ajustada manualmente", { exact: true })).toBeVisible();
  await expect(page.getByText("Pendiente", { exact: true })).toHaveCount(2);
  await capture(page, info, "fe-016-proposal-adjusted-stale");
  await page.getByRole("button", { name: "Guardar orden", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Orden guardado" })).toBeVisible();
  expect(telemetry.publishRequests).toBe(0);
  await capture(page, info, "fe-016-proposal-saved-e2e");
});

test("FE-016 muestra el 503 del optimizador y conserva el DRAFT", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  const telemetry = await openRoutes(page, undefined, { optimize: () => ({ status: 503, body: {} }) });
  await configureBase(page, "Generar automáticamente");
  await addVisit(page, "Mercado Brisa");
  await page.getByRole("button", { name: "Continuar a restricciones" }).click();
  await page.getByLabel("Inicio de jornada").fill("0800"); await page.getByLabel("Fin de jornada").fill("1700");
  const card = page.locator(".route-proposal-dialog__visit").filter({ hasText: "Mercado Brisa" });
  const priority = card.getByRole("button", { name: /Prioridad de Mercado Brisa/ });
  await expect(priority).toHaveText("Sin prioridad especial");
  await priority.click(); await page.getByRole("option", { name: "Alta" }).click();
  await priority.click(); await page.getByRole("option", { name: "Sin prioridad especial" }).click();
  await expect(priority).toHaveText("Sin prioridad especial");
  await card.getByLabel(/Duración estimada de la visita/).fill("30");
  await page.getByRole("button", { name: "Generar propuesta", exact: true }).click();
  await expect.poll(() => telemetry.optimizeRequests).toBe(1);
  expect(telemetry.optimizeInputs[0]?.visits).toEqual([expect.objectContaining({ customerId: "customer-brisa", priority: 1 })]);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Inicio de jornada")).toHaveValue("08:00");
  await capture(page, info, "fe-016-automatic-provider-error");
});

test("FE-016 presenta una propuesta factible del contrato", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page, undefined, { optimize: () => ({ status: 200, body: { routeId: "route-created", published: false, proposalVersion: 6, baseRouteVersion: 1, orderedVisits: [{ customerId: "customer-brisa", sequence: 1 }], unassignedVisits: [], totalTravelSeconds: 1200, totalServiceSeconds: 1800, totalDistanceMeters: 6400, optimality: "FEASIBLE" } }) });
  await configureBase(page, "Generar automáticamente"); await addVisit(page, "Mercado Brisa"); await page.getByRole("button", { name: "Continuar a restricciones" }).click();
  await page.getByLabel("Inicio de jornada").fill("0800"); await page.getByLabel("Fin de jornada").fill("1700");
  const card = page.locator(".route-proposal-dialog__visit").filter({ hasText: "Mercado Brisa" }); await card.getByLabel(/Duración estimada de la visita/).fill("30");
  await page.getByRole("button", { name: "Generar propuesta", exact: true }).click(); await expect(page.getByText("Factible")).toBeVisible(); await capture(page, info, "fe-016-proposal-feasible");
});

test("FE-016 expone conflicto, ocupado y resultado limitado del optimizador", async ({ page }, info) => {
  let resolveOptimize: (() => void) | undefined;
  let status = 409;
  await page.setViewportSize(desktop);
  await openRoutes(page, undefined, { optimize: async () => { if (status === 409) return { status, body: {} }; await new Promise<void>((resolve) => { resolveOptimize = resolve; }); return { status: 200, body: { routeId: "route-created", published: false, proposalVersion: 5, baseRouteVersion: 1, orderedVisits: [{ customerId: "customer-brisa", sequence: 1 }], unassignedVisits: [{ customerId: "customer-brisa", reason: "LIMIT_EXCEEDED" }], totalTravelSeconds: 2880, totalServiceSeconds: 1800, totalDistanceMeters: 18400, optimality: "TIME_LIMIT" } }; } });
  await configureBase(page, "Generar automáticamente"); await addVisit(page, "Mercado Brisa"); await page.getByRole("button", { name: "Continuar a restricciones" }).click();
  await page.getByLabel("Inicio de jornada").fill("0800"); await page.getByLabel("Fin de jornada").fill("1700");
  const card = page.locator(".route-proposal-dialog__visit").filter({ hasText: "Mercado Brisa" }); await card.getByLabel(/Duración estimada de la visita/).fill("30"); await card.getByRole("button", { name: /Prioridad de Mercado Brisa/ }).click(); await page.getByRole("option", { name: "Media" }).click();
  await page.getByRole("button", { name: "Generar propuesta", exact: true }).click(); await expect(page.getByText("La operación entró en conflicto")).toBeVisible(); await capture(page, info, "fe-016-automatic-conflict");
  status = 200; await page.getByRole("button", { name: "Generar propuesta", exact: true }).click(); await expect(page.getByRole("button", { name: "Generando propuesta…" })).toBeDisabled(); await capture(page, info, "fe-016-automatic-generating"); resolveOptimize?.();
  await expect(page.getByRole("heading", { name: "Revisar propuesta automática" })).toBeVisible(); await expect(page.getByText("Límite de tiempo")).toBeVisible(); await expect(page.getByText("Visitas no asignadas")).toBeVisible(); await capture(page, info, "fe-016-proposal-time-limit-unassigned");
});

for (const [name, size] of [
  ["desktop-1280", { width: 1280, height: 720 }],
  ["tablet", { width: 1024, height: 768 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test(`FE-014 responsive ${name}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await openRoutes(page);
    await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
    if (name !== "mobile") await expectWorkspaceGeometry(page);
    if (name === "mobile") {
      const viewToggle = page.getByLabel("Alternar vista");
      await expect(viewToggle.getByRole("button", { name: "Rutas", exact: true })).toBeVisible();
      await viewToggle.getByRole("button", { name: "Mapa", exact: true }).click();
      await expect(page.getByRole("region", { name: "Mapa de rutas" })).toBeVisible();
      await expect(page.getByText("Detalle vial disponible.").first()).toBeVisible({ timeout: 10_000 });
    }
    await capture(page, info, `fe-014-${name}`);
  });
}

test("FE-014 modo oscuro", async ({ page }, info) => {
  await page.setViewportSize(desktop);
  await openRoutes(page);
  await page.getByRole("switch", { name: "Modo oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await compare(page, info, "fe-014-dark", "list", "dark-ready", true);
});

test("FE-014 detalle móvil ocupa el viewport sin cortar cabecera ni acciones", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoutes(page);
  await page.getByRole("button", { name: "Ver detalle" }).click();
  const drawer = page.getByRole("dialog", { name: "Detalle de ruta" });
  await expect(drawer.getByText("Mercado Brisa")).toBeVisible();
  const box = await drawer.boundingBox();
  const header = await drawer.locator(".drawer-surface__header").boundingBox();
  const footer = await drawer.locator(".drawer-surface__footer").boundingBox();
  expect(box!.width).toBe(390);
  expect(header!.y).toBeGreaterThanOrEqual(0);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(845);
  expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await compare(page, info, "fe-014-detail-mobile", "list", "detail-draft");
});

for (const [viewportName, size] of [
  ["1440x900", { width: 1440, height: 900 }],
  ["1280x720", { width: 1280, height: 720 }],
  ["1024x768", { width: 1024, height: 768 }],
  ["390x844", { width: 390, height: 844 }],
] as const) {
  for (const dark of [false, true]) {
    test(`Rutas golden ${viewportName} tema ${dark ? "oscuro" : "claro"}`, async ({ page }, info) => {
      test.setTimeout(60_000);
      await page.setViewportSize(size);
      await openRoutes(page);
      if (dark) await page.getByRole("switch", { name: "Modo oscuro" }).click();

      await configureBase(page, "Crear manualmente");
      await addVisit(page, "Mercado Brisa", "900");
      await addVisit(page, "Librería Sendero", "1200");
      await addVisit(page, "Distribuidora Cauce", "900");
      await addVisit(page, "Comercial Pinar", "1200");
      await page.getByRole("button", { name: "Continuar a orden y mapa" }).click();
      if (size.width <= 760) {
        await expect(page.getByText("Secuencia actual")).toBeVisible();
      } else {
        await expect(page.getByRole("heading", { name: "Mapa de ubicaciones" })).toBeVisible();
        await expect(page.locator(".route-page-workflow .route-sequence-map__marker")).toHaveText(["1", "2", "3", "4"]);
      }
      await compare(page, info, `fe-015-manual-${dark ? "dark" : "light"}`, "manual", "manual-order", dark);
      await page.locator(".route-workflow-heading__actions .shared-button").click();

      await configureBase(page, "Generar automáticamente");
      for (const customer of ["Mercado Brisa", "Librería Sendero", "Distribuidora Cauce", "Comercial Pinar"]) await addVisit(page, customer);
      await page.getByRole("button", { name: "Continuar a restricciones" }).click();
      await expect(page.getByRole("heading", { name: "Generar propuesta automática" })).toBeVisible();
      const headerActionArrow = page.locator(".route-workflow-heading .shared-button svg");
      await expect(headerActionArrow).toHaveCount(1);
      const headerActionArrowBox = await headerActionArrow.boundingBox();
      expect(headerActionArrowBox).not.toBeNull();
      expect(headerActionArrowBox!.width).toBeGreaterThan(0);
      expect(await headerActionArrow.evaluate((arrow) => arrow === arrow.parentElement?.firstElementChild)).toBe(true);
      await expect(page.locator(".route-stepper span")).toHaveText(["1Datos base", "2Clientes", "3Restricciones", "4Generar propuesta", "5Revisar y guardar"]);
      const stepBoxes = await page.locator(".route-stepper__step").evaluateAll((steps) => steps.map((step) => {
        const box = step.getBoundingClientRect();
        return { x: box.x, y: box.y };
      }));
      expect(stepBoxes).toHaveLength(5);
      expect(stepBoxes.slice(1).every((step, index) => step.x > stepBoxes[index]!.x && Math.abs(step.y - stepBoxes[index]!.y) <= 1)).toBe(true);
      await expect(page.locator(".route-stepper__connector")).toHaveCount(4);
      expect(await page.locator(".route-stepper__connector").evaluateAll((connectors) => connectors.every((connector) => connector.getBoundingClientRect().width > 0))).toBe(true);
      await fillGoldenConstraints(page);
      const firstCard = page.locator(".route-proposal-dialog__visit").first();
      const durationBox = await firstCard.getByLabel(/Duración estimada de la visita/).boundingBox();
      const priorityBox = await firstCard.getByRole("button", { name: /Prioridad de Mercado Brisa/ }).boundingBox();
      const windowStartBox = await firstCard.getByLabel("Inicio de ventana").boundingBox();
      const windowEndBox = await firstCard.getByLabel("Fin de ventana").boundingBox();
      expect(durationBox).not.toBeNull(); expect(priorityBox).not.toBeNull(); expect(windowStartBox).not.toBeNull(); expect(windowEndBox).not.toBeNull();
      expect(durationBox!.height).toBeLessThanOrEqual(48);
      expect(priorityBox!.height).toBeLessThanOrEqual(48);
      await expect(page.locator(".route-proposal-dialog__availability .time-field__clock")).toHaveCount(0);
      await expect(firstCard.locator(".time-field__clock")).toHaveCount(2);
      const firstClock = await firstCard.locator(".time-field__clock").first().boundingBox();
      expect(firstClock).not.toBeNull();
      expect(firstClock!.width).toBeGreaterThan(0);
      if (size.width > 760) {
        expect(Math.abs(durationBox!.y - priorityBox!.y)).toBeLessThanOrEqual(4);
        expect(Math.abs(windowStartBox!.y - windowEndBox!.y)).toBeLessThanOrEqual(4);
      } else {
        expect(priorityBox!.y).toBeGreaterThan(durationBox!.y + durationBox!.height);
        expect(windowEndBox!.y).toBeGreaterThan(windowStartBox!.y + windowStartBox!.height);
      }
      const firstVisit = await firstCard.boundingBox();
      const secondVisit = await page.locator(".route-proposal-dialog__visit").nth(1).boundingBox();
      expect(firstVisit).not.toBeNull();
      expect(secondVisit).not.toBeNull();
      if (size.width <= 760) expect(secondVisit!.y).toBeGreaterThan(firstVisit!.y + firstVisit!.height - 1);
      else {
        const availability = await page.locator(".route-proposal-dialog__availability").boundingBox();
        expect(availability).not.toBeNull();
        expect(Math.abs(firstVisit!.y - availability!.y)).toBeLessThanOrEqual(4);
        expect(firstVisit!.height).toBeLessThanOrEqual(244);
        const rowGap = secondVisit!.y - (firstVisit!.y + firstVisit!.height);
        expect(rowGap).toBeGreaterThanOrEqual(10);
        expect(rowGap).toBeLessThanOrEqual(14);
      }
      await compare(page, info, `fe-016-constraints-${dark ? "dark" : "light"}`, "automatic", "automatic-constraints", dark);
      await page.getByRole("button", { name: "Guardar y salir" }).click();

      await page.getByRole("button", { name: "Acciones de Ruta Norte 04" }).click();
      await page.getByRole("menuitem", { name: "Publicar ruta" }).click();
      await expect(page.getByText("Orden final de visitas")).toBeVisible();
      const order = await page.locator(".route-publish-layout > section.route-publish-order").boundingBox();
      const mapPanel = page.locator(".route-publish-layout > details.route-publish-map[open]");
      const map = await mapPanel.locator(".route-sequence-map").boundingBox();
      expect(order).not.toBeNull(); expect(map).not.toBeNull(); expect(map!.y).toBeGreaterThan(order!.y);
      expect(map!.width).toBeGreaterThan(order!.width * 0.8);
      await expect(mapPanel).toBeVisible();
      const notifyBox = await page.locator(".route-publish-validation .route-publish-dialog__choice").boundingBox();
      const warningBox = await page.locator(".route-publish-validation .route-inline-notice").boundingBox();
      expect(notifyBox).not.toBeNull(); expect(warningBox).not.toBeNull();
      expect(warningBox!.y - (notifyBox!.y + notifyBox!.height)).toBeGreaterThanOrEqual(16);
      await expect(page.getByRole("button", { name: "Volver al detalle" })).toBeVisible();
      await expect(page.locator(".route-publish-body .route-info svg")).toBeVisible();
      await compare(page, info, `fe-017-review-${dark ? "dark" : "light"}`, "publish", "publish-review", dark);
      await captureLowerComparison(page, info, `fe-017-review-${dark ? "dark" : "light"}-${viewportName}`, "publish", "publish-review", dark);
      await expect(page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
    });
  }
}
