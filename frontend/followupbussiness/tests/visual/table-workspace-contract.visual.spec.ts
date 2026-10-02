import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const identity = {
  id: "identity-workspace",
  displayName: "Alex Medina",
  email: "alex.medina@comercialandina.example",
  status: "ACTIVE",
  roles: ["COMPANY_ADMIN"],
  company: { id: "company-workspace", legalName: "Comercial Andina" },
};

const session = {
  channel: "WEB",
  credentials: { accessToken: "workspace-token", tokenType: "Bearer", expiresIn: 600 },
  csrfToken: "c".repeat(43),
  user: identity,
};

const users = Array.from({ length: 5 }, (_, index) => ({
  id: `user-${index}`,
  displayName: `Usuario ${index + 1}`,
  email: `usuario${index + 1}@comercialandina.example`,
  username: `usuario${index + 1}`,
  role: index % 2 === 0 ? "COMPANY_ADMIN" : "SUPERVISOR",
  status: "ACTIVE",
  createdAt: "2026-09-10T10:38:00-05:00",
  updatedAt: "2026-09-10T10:38:00-05:00",
  version: 1,
}));

const sellers = Array.from({ length: 5 }, (_, index) => ({
  id: `seller-${index}`,
  userId: `seller-user-${index}`,
  displayName: `Vendedor ${index + 1}`,
  email: `vendedor${index + 1}@comercialandina.example`,
  phone: `+51 999 000 00${index}`,
  employeeCode: `V-${index + 1}`,
  supervisorId: null,
  territoryIds: [],
  supervisor: null,
  territories: [],
  status: "ACTIVE",
  createdAt: "2026-09-10T10:38:00-05:00",
  updatedAt: "2026-09-10T10:38:00-05:00",
  version: 1,
}));
const territories = Array.from({ length: 5 }, (_, index) => ({
  id: `territory-${index}`, name: `Zona ${index + 1}`, code: `Z-${index + 1}`,
  description: "Zona comercial de prueba", status: index % 2 ? "INACTIVE" : "ACTIVE",
  assignedSellerCount: index + 1, createdAt: "2026-09-10T10:38:00-05:00", updatedAt: "2026-09-10T10:38:00-05:00", version: 1,
}));

async function bootstrap(page: Page) {
  await page.addInitScript(() => {
    const NativeDate = Date;
    class ContractDate extends NativeDate {
      constructor(...args: ConstructorParameters<DateConstructor>) {
        super(...(args.length ? args : ["2026-09-10T10:42:00-05:00"]));
      }
      static now() {
        return new NativeDate("2026-09-10T10:42:00-05:00").valueOf();
      }
    }
    window.Date = ContractDate as DateConstructor;
  });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const pageNumber = Number(url.searchParams.get("page") ?? 0);
    const body = path.endsWith("/me")
      ? identity
      : path.endsWith("/sellers")
        ? { items: sellers, page: { page: pageNumber, pageSize: 5, totalElements: 128, totalPages: 26 } }
        : path.endsWith("/company/users")
          ? { items: users, page: { page: pageNumber, pageSize: 5, totalElements: 128, totalPages: 26 } }
          : path.endsWith("/territories")
            ? { items: territories, page: { page: pageNumber, pageSize: 5, totalElements: 128, totalPages: 26 } }
            : session;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/");
  await page.getByLabel("Correo o nombre de usuario").fill(identity.email);
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
}

async function openWorkspace(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByText("Resultados", { exact: true })).toBeVisible();
  await expect(page.locator('[data-ui="data-table"] tbody tr')).toHaveCount(5);
}

async function workspaceStyles(page: Page) {
  return page.locator('[data-ui="data-table-panel"]').evaluate((panel) => {
    const required = <T extends Element>(selector: string) => {
      const element = panel.querySelector<T>(selector);
      if (!element) throw new Error(`Falta ${selector}`);
      return element;
    };
    const css = (element: Element, properties: readonly string[], pseudo?: string) => {
      const style = getComputedStyle(element, pseudo);
      return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
    };
    const toolbar = required('[data-ui="data-table-toolbar"]');
    const search = required('[data-ui="search-field"]');
    const searchLabel = required('[data-ui="search-field"] > span:first-child');
    const filterLabel = required('[data-ui="filter-field"] > span:first-child');
    const control = required(".data-table-search-field__control");
    const input = required<HTMLInputElement>(".data-table-search-field__control input");
    const results = required('[data-ui="data-table-results-header"]');
    const title = required('[data-ui="data-table-results-header"] strong');
    const tableHeader = required('[data-ui="data-table"] th');
    const tableRow = required('[data-ui="data-table"] tbody tr');
    const tableCell = required('[data-ui="data-table"] td');
    const footer = required('[data-ui="data-table-pagination"]');
    const pageButton = required('[data-ui="data-table-pagination"] nav button');
    return {
      panel: css(panel, ["border-top-width", "border-top-color", "border-top-left-radius", "background-color", "box-shadow"]),
      toolbar: css(toolbar, ["column-gap", "row-gap", "padding-top", "padding-right", "padding-bottom", "padding-left", "background-color"]),
      searchLabel: css(searchLabel, ["font-size", "font-weight", "line-height"]),
      filterLabel: css(filterLabel, ["font-size", "font-weight", "line-height"]),
      field: css(search, ["row-gap"]),
      control: { ...css(control, ["height", "border-top-width", "border-top-color", "border-top-left-radius", "background-color"]), boxHeight: control.getBoundingClientRect().height },
      input: css(input, ["font-size", "font-weight", "line-height"]),
      placeholder: css(input, ["font-weight", "color"], "::placeholder"),
      results: { ...css(results, ["min-height", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-bottom-width", "border-bottom-color", "background-color"]), boxHeight: results.getBoundingClientRect().height },
      title: css(title, ["font-size", "font-weight", "line-height"]),
      tableHeader: css(tableHeader, ["font-size", "font-weight", "line-height", "padding-top", "padding-right", "padding-bottom", "padding-left", "background-color", "text-transform"]),
      tableRow: { ...css(tableRow, ["height"]), boxHeight: tableRow.getBoundingClientRect().height },
      tableCell: css(tableCell, ["height", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width"]),
      footer: css(footer, ["padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width", "border-top-color", "background-color"]),
      pageButton: css(pageButton, ["height", "border-top-width", "border-top-color", "border-top-left-radius", "background-color"]),
    };
  });
}

async function expectSharedStructure(page: Page) {
  for (const component of [
    "data-table-panel",
    "data-table-toolbar",
    "search-field",
    "data-table-results-header",
    "data-table",
    "data-table-pagination",
  ]) {
    await expect(page.locator(`[data-ui="${component}"]`)).toHaveCount(1);
  }
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
  { name: "dark", width: 1440, height: 900, dark: true },
] as const) {
  test(`workspace tabular homologado en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await bootstrap(page);
    await openWorkspace(page, "/company/administrators-supervisors");
    if ("dark" in viewport && viewport.dark)
      await page.getByRole("switch", { name: "Modo oscuro" }).click();
    await expectSharedStructure(page);
    const userStyles = await workspaceStyles(page);
    const { tableRow: userRow, tableCell: userCell, ...userRest } = userStyles;
    const { height: userCellHeight, ...userCellShared } = userCell;
    const userSharedStyles = { ...userRest, tableCell: userCellShared };
    expect(await page.locator('[data-ui="filter-field"]').count()).toBe(2);
    await openWorkspace(page, "/company/sellers");
    await expectSharedStructure(page);
    const sellerStyles = await workspaceStyles(page);
    const { tableRow: sellerRow, tableCell: sellerCell, ...sellerRest } = sellerStyles;
    const { height: sellerCellHeight, ...sellerCellShared } = sellerCell;
    const sellerSharedStyles = { ...sellerRest, tableCell: sellerCellShared };
    expect(await page.locator('[data-ui="filter-field"]').count()).toBe(3);
    expect(sellerSharedStyles).toEqual(userSharedStyles);
    await openWorkspace(page, "/company/territories");
    await expectSharedStructure(page);
    const territoryStyles = await workspaceStyles(page);
    const { tableRow: territoryRow, tableCell: territoryCell, ...territoryRest } = territoryStyles;
    const { height: territoryCellHeight, ...territoryCellShared } = territoryCell;
    const territorySharedStyles = { ...territoryRest, tableCell: territoryCellShared };
    expect(await page.locator('[data-ui="filter-field"]').count()).toBe(1);
    expect(territorySharedStyles).toEqual(userSharedStyles);

    expect(userStyles.searchLabel).toEqual({ "font-size": "12px", "font-weight": "700", "line-height": "16px" });
    expect(userStyles.filterLabel).toEqual(userStyles.searchLabel);
    expect(userStyles.field["row-gap"]).toBe("6px");
    expect(userStyles.control.boxHeight).toBe(44);
    expect(userStyles.input["font-weight"]).toBe("400");
    expect(userStyles.placeholder["font-weight"]).toBe("400");
    expect(userStyles.results.boxHeight).toBeGreaterThanOrEqual(54);
    expect(userStyles.results["padding-top"]).toBe("10px");
    expect(userStyles.results["padding-right"]).toBe("14px");
    expect(userStyles.title["font-size"]).toBe("14px");
    expect(userStyles.tableHeader["font-size"]).toBe("11px");
    expect(userStyles.tableHeader["font-weight"]).toBe("700");
    if (viewport.width > 620) {
      expect([userRow.boxHeight, sellerRow.boxHeight, territoryRow.boxHeight]).toEqual([54, 54, 54]);
    } else {
      expect([userRow.boxHeight, sellerRow.boxHeight, territoryRow.boxHeight].every((height) => height > 54)).toBe(true);
    }
    expect([userCellHeight, sellerCellHeight, territoryCellHeight].every((height) => Number.parseFloat(height) > 0)).toBe(true);
  });
}

test("la base golden y el acento de selectores coinciden con el tema oscuro", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrap(page);
  await openWorkspace(page, "/company/administrators-supervisors");
  await page.getByRole("switch", { name: "Modo oscuro" }).click();

  const golden = await page.context().newPage();
  await golden.goto(pathToFileURL(resolve(process.cwd(), "../../docs/frontendMockups/_design-system.html")).href);
  await golden.locator("#theme").evaluate((element) => { (element as HTMLInputElement).checked = true; });

  const styles = (element: Element) => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(["color", "background-color", "border-top-color"].map((property) => [property, computed.getPropertyValue(property)]));
  };
  const goldenHeader = await golden.locator(".table-shell th").first().evaluate(styles);
  const appHeader = await page.locator(".data-table--golden th").first().evaluate(styles);
  expect(appHeader.color).toBe(goldenHeader.color);
  expect(appHeader["background-color"]).toBe(goldenHeader["background-color"]);

  const goldenSelect = await golden.locator(".select-demo .select-trigger").first().evaluate(styles);
  const appSelect = await page.locator(".data-table-toolbar .visual-select--golden .visual-select__trigger").first().evaluate(styles);
  expect(appSelect).toEqual(goldenSelect);

  await page.locator(".data-table-toolbar .visual-select--golden .visual-select__trigger").first().click();
  const appOption = await page.locator(".visual-select__menu--golden button[aria-selected='true']").first().evaluate(styles);
  expect(appOption.color).toBe("rgb(132, 173, 255)");
  expect(appOption["background-color"]).toBe("rgb(23, 37, 84)");
  await golden.close();
});

test("el acento compartido de las tablas evita superficies blancas en oscuro", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrap(page);
  await openWorkspace(page, "/company/administrators-supervisors");
  await page.getByRole("switch", { name: "Modo oscuro" }).click();

  await expect(page.locator(".data-table__identity-mark").first()).toHaveCSS("background-color", "rgb(23, 37, 84)");
  await expect(page.locator(".data-table__identity-mark").first()).toHaveCSS("color", "rgb(132, 173, 255)");
  await expect(page.locator(".data-table__pagination [aria-current]")).toHaveCSS("background-color", "rgb(23, 37, 84)");
  await expect(page.getByRole("button", { name: "Registros por página" })).toHaveCSS("background-color", "rgb(17, 24, 39)");
});

test("encabezados y acciones compartidas conservan contraste legible en ambos temas", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrap(page);
  for (const dark of [false, true]) {
    await openWorkspace(page, "/company/territories");
    if (dark) await page.getByRole("switch", { name: "Modo oscuro" }).click();
    for (const selector of [".data-table--golden th", ".territory-list__create"]) {
      const ratio = await page.locator(selector).first().evaluate((element) => {
        const channel = (value: string) => {
          const match = value.match(/rgba?\(([^)]+)\)/);
          if (!match) throw new Error(`Color no RGB: ${value}`);
          return match[1].split(/[,\s/]+/).slice(0, 3).map(Number);
        };
        const luminance = (value: string) => {
          const [red, green, blue] = channel(value).map((part) => {
            const normalized = part / 255;
            return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return red * 0.2126 + green * 0.7152 + blue * 0.0722;
        };
        const css = getComputedStyle(element);
        const foreground = luminance(css.color);
        const background = luminance(css.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(ratio, `${dark ? "oscuro" : "claro"}: ${selector}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});
