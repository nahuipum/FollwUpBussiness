import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const client = {
  id: "customer-1", name: "Mercado Aurora", segment: "Minorista", territoryId: null,
  assignedSellerIds: [], status: "ACTIVE", location: { latitude: -12.0864, longitude: -77.0365 },
  createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-12T15:11:00Z", version: 3,
};

async function openMap(page: Page, viewport: { width: number; height: number }, scenario: { role?: "SUPERVISOR"; status?: number; empty?: boolean; delay?: boolean; stale?: boolean; provider?: "failed"; clients?: readonly typeof client[]; mapStyleRequests?: string[] } = {}) {
  await page.clock.setFixedTime(new Date("2026-09-12T15:11:00-05:00"));
  await page.setViewportSize(viewport);
  const role = scenario.role ?? "COMPANY_ADMIN";
  const user = { id: "user-1", displayName: "Administradora visual", email: "visual@example.test", status: "ACTIVE", roles: [role], company: { id: "company-1", legalName: "Comercial Andina" } };
  await page.route("https://maps.geoapify.com/**", async (route) => {
    if (scenario.provider === "failed") return route.abort("failed");
    const styleUrl = route.request().url();
    scenario.mapStyleRequests?.push(styleUrl);
    const backgroundColor = /\/styles\/dark-matter\//.test(styleUrl) ? "#0f172a" : "#f5f7fb";
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": backgroundColor } }] }) });
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
    if (path.endsWith("/customers")) { const requestUrl = new URL(route.request().url()); if (scenario.delay || (scenario.stale && requestUrl.searchParams.has("search"))) return new Promise<void>(() => undefined); const status = scenario.status ?? 200; const noResults = scenario.empty || requestUrl.searchParams.has("search"); return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? { items: noResults ? [] : scenario.clients ?? [client], page: { page: 0, pageSize: 200, totalElements: noResults ? 0 : (scenario.clients ?? [client]).length, totalPages: 1 } } : { title: "Error", status }) }); }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ channel: "WEB", credentials: { accessToken: "visual", tokenType: "Bearer", expiresIn: 600 }, csrfToken: "c".repeat(43), user }) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill("visual@example.test");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto(role === "SUPERVISOR" ? "/supervisor/clients/map" : "/company/clients/map");
  await expect(page.locator("#client-map-page-title")).toHaveText("Mapa general de clientes");
}

for (const viewport of [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "tablet", width: 900, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test(`mapa de clientes ${viewport.name}`, async ({ page }) => {
    await openMap(page, viewport);
    await expect(page.getByText(/Mapa activo/)).toBeVisible();
    await expect(page.locator("#main-content")).toHaveScreenshot(`company-clients-map-${viewport.name}.png`, { animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) test(`el aviso de alcance supervisor conserva el estándar FE-010 a ${viewport.width}px`, async ({ page }) => {
  await openMap(page, viewport, { role: "SUPERVISOR" });
  const notice = page.locator("#main-content .read-only-notice--golden");
  await expect(notice).toContainText("Los filtros nunca amplían este alcance.");
  const golden = await page.context().newPage();
  await golden.setViewportSize(viewport);
  await golden.goto(`${pathToFileURL(resolve(process.cwd(), "../../docs/frontendMockups/FE-010.html")).href}?state=ready-supervisor`);
  const reference = golden.locator(".read-only-notice");
  await expect(reference).toBeVisible();
  const properties = ["color", "background-color", "border-top-color", "border-top-left-radius", "padding-top", "padding-right", "font-size", "margin-right", "margin-bottom"];
  const computed = (element: Element, names: string[]) => Object.fromEntries(names.map((name) => [name, getComputedStyle(element).getPropertyValue(name)]));
  const expected = await reference.evaluate(computed, properties);
  const actual = await notice.evaluate(computed, properties);
  expect(actual).toEqual(expected);
  expect(await page.locator("#main-content").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await golden.close();
});

test("mapa de clientes oscuro", async ({ page }) => {
  const mapStyleRequests: string[] = [];
  await openMap(page, { width: 1440, height: 900 }, { mapStyleRequests });
  await page.getByRole("switch", { name: "Modo oscuro" }).click();
  await expect.poll(() => mapStyleRequests.some((url) => /\/styles\/dark-matter\//.test(url))).toBe(true);
  const clientItem = page.getByRole("button", { name: /Mercado Aurora Activo/ });
  await clientItem.hover();
  await expect(clientItem).toHaveCSS("color", "rgb(248, 250, 252)");
  await expect(clientItem).toHaveCSS("background-color", "rgb(27, 38, 56)");
  const attribution = page.locator(".maplibregl-ctrl-attrib");
  await expect(attribution).toHaveCSS("background-color", "rgb(23, 32, 51)");
  await expect(attribution.locator("a").first()).toHaveCSS("color", "rgb(132, 173, 255)");
  await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-dark.png", { animations: "disabled" });
});

test("mapa de clientes con proveedor fallido", async ({ page }) => {
  await openMap(page, { width: 1440, height: 900 }, { provider: "failed" });
  await expect(page.getByText(/No pudimos cargar los mosaicos del mapa/)).toBeVisible();
  await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-provider-failed.png", { animations: "disabled" });
});

test("mapa de clientes no configurado", async ({ page }) => {
  test.skip(process.env.VISUAL_MAP_UNCONFIGURED !== "1", "requiere ejecución aislada sin VITE_GEOAPIFY_TILE_KEY");
  await openMap(page, { width: 1440, height: 900 });
  await expect(page.getByText(/Mapa no disponible: faltan los mosaicos configurados/)).toBeVisible();
  await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-unconfigured.png", { animations: "disabled" });
});

for (const state of [
  ["ready-supervisor", { role: "SUPERVISOR" as const }], ["empty", { empty: true }], ["empty-supervisor", { role: "SUPERVISOR" as const, empty: true }], ["initial-error", { status: 500 }], ["forbidden", { status: 403 }], ["loading", { delay: true }],
] as const) test(`mapa de clientes ${state[0]}`, async ({ page }) => { await openMap(page, { width: 1440, height: 900 }, state[1]); if (state[0] === "loading") await expect(page.getByRole("status", { name: "Cargando clientes" })).toBeVisible(); else if (state[0].includes("empty")) await expect(page.getByRole("heading", { name: "Aún no hay clientes" })).toBeVisible(); else if (state[0] === "forbidden") await expect(page.getByText("No tienes permisos")).toBeVisible(); else if (state[0] === "initial-error") await expect(page.getByText("No pudimos cargar los clientes")).toBeVisible(); else await expect(page.locator("#client-map-page-title")).toBeVisible(); await expect(page.locator("#main-content")).toHaveScreenshot(`company-clients-map-${state[0]}.png`, { animations: "disabled" }); });

test("mapa de clientes lista extensa, inactivo y selección", async ({ page }) => {
  const clients = Array.from({ length: 120 }, (_, index) => ({ ...client, id: `customer-${index}`, name: `Cliente de cartera ${index + 1}`, status: index === 1 ? "INACTIVE" as const : "ACTIVE" as const, location: { latitude: -12.22 + ((index * 17) % 80) / 1000, longitude: -77.18 + ((index * 29) % 120) / 1000 } }));
  const mapStatusHistory = "__clientMapStatusHistory";
  await openMap(page, { width: 1280, height: 800 }, { clients });
  await expect(page.getByRole("button", { name: /Cliente de cartera 2 Inactivo/ })).toBeVisible();
  await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-long-inactive.png", { animations: "disabled" });
  await page.evaluate((historyKey) => {
    const target = window as typeof window & Record<string, string[] | MutationObserver | undefined>;
    const record = () => {
      const statuses = Array.from(document.querySelectorAll('[role="status"]')).map((status) => status.textContent?.trim());
      target[historyKey] = [...(target[historyKey] as string[] ?? []), ...statuses.filter((status): status is string => Boolean(status))];
    };
    (target[`${historyKey}Observer`] as MutationObserver | undefined)?.disconnect();
    const observer = new MutationObserver(record);
    target[`${historyKey}Observer`] = observer;
    target[historyKey] = [];
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }, mapStatusHistory);
  await page.getByRole("button", { name: /Cliente de cartera 1 Activo/ }).click();
  await expect.poll(() => page.evaluate((historyKey) => (window as typeof window & Record<string, string[]>)[historyKey].includes("Cargando mapa…"), mapStatusHistory)).toBe(true);
  await expect.poll(() => page.evaluate((historyKey) => {
    const history = (window as typeof window & Record<string, string[]>)[historyKey];
    return history.lastIndexOf("Mapa activo. Incluye atribución del proveedor.") > history.lastIndexOf("Cargando mapa…");
  }, mapStatusHistory)).toBe(true);
  await expect(page.locator(".map-marker--selected")).toHaveCount(1);
  await expect(page.locator(".client-map__attribution")).toHaveText("Mapa activo. Incluye atribución del proveedor.");
  await expect(page.getByRole("button", { name: /Cliente de cartera 1 Activo/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".client-map__popup .maplibregl-popup-content")).toBeVisible();
  await expect(page.locator(".client-map__popup-body strong")).toHaveText("Cliente de cartera 1");
  await expect(page.locator(".client-map__popup-status")).toHaveText("Activo");
  await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-selected.png", { animations: "disabled" });
});

test("los marcadores conservan el anclaje geográfico al cambiar el zoom", async ({ page }) => {
  const clients = [
    client,
    { ...client, id: "customer-2", name: "Botica Horizonte", location: { latitude: -12.1364, longitude: -77.0965 } },
  ];
  await openMap(page, { width: 1280, height: 800 }, { clients });
  const markers = page.locator(".maplibregl-marker.map-marker");
  await expect(markers).toHaveCount(2);
  const before = await markers.evaluateAll((nodes) => nodes.map((node) => ({ position: getComputedStyle(node).position, transform: node.getAttribute("style") })));
  expect(before.every((marker) => marker.position === "absolute" && marker.transform?.includes("translate"))).toBe(true);

  const canvas = page.locator(".client-map__canvas");
  await canvas.hover();
  await page.mouse.wheel(0, -600);
  await expect.poll(async () => markers.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("style")))).not.toEqual(before.map((marker) => marker.transform));

  await page.mouse.wheel(0, 600);
  await expect(markers).toHaveCount(2);
  await expect.poll(async () => markers.evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).position === "absolute" && node.getAttribute("style")?.includes("translate")))).toBe(true);
});

test("mapa de clientes filtros activos y sin resultados", async ({ page }) => { await openMap(page, { width: 1440, height: 900 }); await page.getByRole("searchbox", { name: "Buscar por nombre o segmento" }).fill("sin coincidencias"); await expect(page.getByText("No encontramos clientes.")).toBeVisible(); await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-no-results.png", { animations: "disabled" }); });
test("mapa de clientes conserva datos stale durante actualización", async ({ page }) => { await openMap(page, { width: 1440, height: 900 }, { stale: true }); await expect(page.getByRole("button", { name: /Mercado Aurora Activo/ })).toBeVisible(); await page.getByRole("searchbox", { name: "Buscar por nombre o segmento" }).fill("Aurora"); await expect(page.getByText(/se mantiene la última respuesta disponible/)).toBeVisible(); await expect(page.getByRole("button", { name: /Mercado Aurora Activo/ })).toBeVisible(); await expect(page.locator("#main-content")).toHaveScreenshot("company-clients-map-stale.png", { animations: "disabled" }); });
