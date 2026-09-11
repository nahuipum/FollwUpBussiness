import { expect, test, type Page } from "@playwright/test";

const seller = {
  id: "seller-ana",
  userId: "user-ana",
  displayName: "Ana Torres",
  email: "ana.torres@comercialandina.example",
  phone: "+51 999 111 222",
  employeeCode: "V-001",
  supervisorId: null,
  territoryIds: ["territory-norte"],
  supervisor: null,
  territories: [{ id: "territory-norte", code: "NOR", name: "Norte" }],
  status: "ACTIVE",
  createdAt: "2026-09-10T10:38:00-05:00",
  updatedAt: "2026-09-10T10:38:00-05:00",
  version: 1,
};
const invitedSeller = { ...seller, id: "seller-invited", displayName: "Beatriz Ramos", status: "INVITED" };
const inactiveSeller = { ...seller, id: "seller-inactive", displayName: "Carla Vega", status: "INACTIVE" };
const sellers = [seller, invitedSeller, inactiveSeller, { ...seller, id: "seller-four", displayName: "Diego Salas" }, { ...seller, id: "seller-five", displayName: "Elena Prado" }];

const session = (role = "COMPANY_ADMIN") => ({
  channel: "WEB",
  credentials: { accessToken: "visual-token", tokenType: "Bearer", expiresIn: 600 },
  csrfToken: "c".repeat(43),
  user: {
    id: "identity-visual",
    displayName: "Alex Medina",
    email: "alex.medina@comercialandina.example",
    status: "ACTIVE",
    roles: [role],
    company: { id: "company-visual", legalName: "Comercial Andina" },
  },
});

async function open(
  page: Page,
  options: { role?: string; status?: number; items?: typeof sellers; loading?: boolean; statusConflict?: boolean } = {},
) {
  const current = session(options.role);
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
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/status") && options.statusConflict) {
      await route.fulfill({
        status: 409,
        contentType: "application/problem+json",
        body: JSON.stringify({
          status: 409,
          correlationId: "00000000-0000-4000-8000-000000000007",
        }),
      });
      return;
    }
    if (path.endsWith("/sellers") && options.loading) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      return;
    }
    const responseStatus = path.endsWith("/sellers") ? (options.status ?? 200) : 200;
    const body = path.endsWith("/me")
      ? current.user
      : path.endsWith("/sellers")
        ? { items: options.items ?? sellers, page: { page: 0, pageSize: 5, totalElements: 128, totalPages: 26 } }
        : path.startsWith("/api/territories")
          ? { items: [{ id: "territory-norte", code: "NOR", name: "Norte" }], page: { page: 0, pageSize: 100, totalElements: 1, totalPages: 1 } }
          : path.startsWith("/api/company/users")
            ? { items: [], page: { page: 0, pageSize: 100, totalElements: 0, totalPages: 1 } }
            : current;
    await route.fulfill({ status: responseStatus, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill("alex.medina@comercialandina.example");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto("/company/sellers");
  if (options.loading) {
    await expect(page.getByRole("status", { name: "Cargando vendedores" })).toBeVisible();
  } else if (options.status === 403) {
    await expect(page.getByRole("heading", { name: "No tienes permisos" })).toBeVisible();
  } else if (options.status === 500) {
    await expect(page.getByRole("heading", { name: "Ocurrió un problema temporal" })).toBeVisible();
  } else if ((options.items ?? sellers).length === 0) {
    await expect(page.getByRole("heading", { name: "Aún no hay vendedores" })).toBeVisible();
  } else {
    await expect(page.getByText("Resultados", { exact: true })).toBeVisible();
  }
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/fe005-audit-after/current-${name}.png`, fullPage: false });
  await expect(page).toHaveScreenshot(`fe-005-${name}.png`, { animations: "disabled", maxDiffPixelRatio: 0.02 });
}

for (const [name, width, height] of [["desktop-1440", 1440, 900], ["desktop-1024", 1024, 900], ["tablet-768", 768, 900], ["mobile-390", 390, 844]] as const) {
  test(`FE-005 listado ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    await expect(page.getByText("Resultados", { exact: true })).toBeVisible();
    await expect(page.getByText("Mostrando 1–5 de 128 vendedores")).toBeVisible();
    await screenshot(page, name);
  });
}

test("FE-005 dark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("switch", { name: "Modo oscuro" }).click();
  await screenshot(page, "dark");
});

test("FE-005 loading", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { loading: true });
  await expect(page.getByRole("status", { name: "Cargando vendedores" })).toBeVisible();
  await screenshot(page, "loading");
});

test("FE-005 empty, error y forbidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { items: [] });
  await screenshot(page, "empty");
});

test("FE-005 error", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { status: 500, items: [] });
  await screenshot(page, "error");
});

test("FE-005 forbidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { status: 403, items: [] });
  await screenshot(page, "forbidden");
});

test("FE-005 menús y overlays canónicos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("button", { name: "Más acciones para Ana Torres" }).click();
  await screenshot(page, "menu-active");
  await page.getByRole("menuitem", { name: "Inactivar" }).click();
  await expect(page.getByRole("alertdialog", { name: "Inactivar vendedor" })).toBeVisible();
  await screenshot(page, "confirm-inactivate");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Más acciones para Beatriz Ramos" }).click();
  await page.getByRole("menuitem", { name: "Reenviar invitación" }).click();
  await expect(page.getByRole("alertdialog", { name: "Reenviar invitación" })).toBeVisible();
  await screenshot(page, "confirm-resend");
});

test("FE-005 menús invited e inactive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("button", { name: "Más acciones para Beatriz Ramos" }).click();
  await screenshot(page, "menu-invited");
  await page.getByRole("menu").press("Escape");
  await page.getByRole("button", { name: "Más acciones para Carla Vega" }).click();
  await screenshot(page, "menu-inactive");
});

test("FE-005 drawers y paginación", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("button", { name: "Crear vendedor" }).click();
  await expect(page.getByRole("dialog", { name: "Crear vendedor" })).toBeVisible();
  await screenshot(page, "drawer-create");
  await page.getByRole("dialog").getByLabel("Cerrar").click();
  await page.getByRole("button", { name: "Más acciones para Ana Torres" }).click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await expect(page.getByRole("dialog", { name: "Editar vendedor" })).toBeVisible();
  await screenshot(page, "drawer-edit");
  await page.getByRole("dialog").getByLabel("Cerrar").click();
  await page.getByRole("button", { name: "Más acciones para Ana Torres" }).click();
  await page.getByRole("menuitem", { name: "Ver detalle" }).click();
  await expect(page.getByRole("dialog", { name: "Detalle de vendedor" })).toBeVisible();
  await screenshot(page, "drawer-detail");
  await page.getByRole("dialog").getByLabel("Cerrar").click();
  await page.getByRole("button", { name: "Más acciones para Ana Torres" }).click();
  await page.getByRole("menuitem", { name: "Asignar supervisor" }).click();
  await expect(page.getByRole("dialog", { name: "Asignar supervisor" })).toBeVisible();
  await screenshot(page, "drawer-supervisor");
  await page.getByRole("dialog").getByLabel("Cerrar").click();
  await page.getByRole("button", { name: "Más acciones para Ana Torres" }).click();
  await page.getByRole("menuitem", { name: "Asignar territorios" }).click();
  await expect(page.getByRole("dialog", { name: "Asignar territorios" })).toBeVisible();
  await screenshot(page, "drawer-territories");
  await page.getByRole("dialog").getByLabel("Cerrar").click();
  await expect(page.locator(".data-table__ellipsis")).toBeVisible();
  await screenshot(page, "pagination-multiple");
});

test("FE-005 selector de territorios respeta borde, selección y foco", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole("button", { name: "Crear vendedor" }).click();
  const drawerBody = page.locator(".drawer-surface__body");
  await drawerBody.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  const trigger = page.getByRole("button", { name: "Territorios" });
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Territorios" });
  await expect(menu.getByPlaceholder("Buscar por código o nombre")).toBeVisible();
  await expect(menu.getByRole("option", { name: "NOR — Norte" })).toBeVisible();
  await expect(menu.getByText("1 coincidencia visible")).toBeVisible();
  await expect(menu.getByText("1 territorios disponibles")).toBeVisible();
  const box = await menu.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(14);
  expect(box!.x + box!.width).toBeLessThanOrEqual(376);
  expect(box!.y).toBeGreaterThanOrEqual(14);
  expect(box!.y + box!.height).toBeLessThanOrEqual(830);
  await page.screenshot({ path: "test-results/fe005-audit-after/selector-open-390.png", fullPage: false });
  await menu.getByRole("option", { name: "NOR — Norte" }).click();
  await expect(trigger).toHaveText("1 territorio seleccionado");
  await page.screenshot({ path: "test-results/fe005-audit-after/selector-selected-390.png", fullPage: false });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("FE-005 conflicto de inactivación", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { statusConflict: true });
  await page.getByRole("button", { name: "Más acciones para Ana Torres" }).click();
  await page.getByRole("menuitem", { name: "Inactivar" }).click();
  await page.getByLabel("Motivo").fill("Conflicto de jornada activa");
  await page.getByRole("button", { name: "Inactivar vendedor" }).click();
  await expect(page.getByText("Correlation ID: 00000000-0000-4000-8000-000000000007")).toBeVisible();
  await screenshot(page, "conflict");
});
