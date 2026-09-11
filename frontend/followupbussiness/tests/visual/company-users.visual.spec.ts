import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "u-marina",
  displayName: "Marina Torres",
  email: "marina.torres@comercialandina.example",
  username: "mtorres",
  role: "COMPANY_ADMIN",
  status: "ACTIVE",
  createdAt: "2026-09-10T10:38:00-05:00",
  updatedAt: "2026-09-10T10:38:00-05:00",
  version: 1,
};
const readyUsers = [
  user,
  {
    ...user,
    id: "u-julian",
    displayName: "Julián Quispe",
    email: "julian.quispe@comercialandina.example",
    username: "jquispe",
    role: "SUPERVISOR",
    updatedAt: "2026-09-10T09:22:00-05:00",
  },
  {
    ...user,
    id: "u-camila",
    displayName: "Camila Vega",
    email: "camila.vega@comercialandina.example",
    username: "cvega",
    role: "SUPERVISOR",
    status: "INVITED",
    updatedAt: "2026-09-09T16:15:00-05:00",
  },
  {
    ...user,
    id: "u-diego",
    displayName: "Diego Salas",
    email: "diego.salas@comercialandina.example",
    username: "dsalas",
    status: "LOCKED",
    updatedAt: "2026-09-08T18:40:00-05:00",
  },
  {
    ...user,
    id: "u-renata",
    displayName: "Renata Ponce",
    email: "renata.ponce@comercialandina.example",
    username: "rponce",
    role: "SUPERVISOR",
    status: "INACTIVE",
    updatedAt: "2026-09-05T14:08:00-05:00",
  },
];
const session = (role = "COMPANY_ADMIN") => ({
  channel: "WEB",
  credentials: {
    accessToken: "visual-token",
    tokenType: "Bearer",
    expiresIn: 600,
  },
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
  role = "COMPANY_ADMIN",
  status = 200,
  items = [user],
  detail: "ready" | "loading" | "error" = "ready",
  listLoading = false,
) {
  const current = session(role);
  await page.addInitScript(() => {
    const NativeDate = Date;
    class VisualDate extends NativeDate {
      constructor(...args: ConstructorParameters<DateConstructor>) {
        super(...(args.length ? args : ["2026-09-10T10:42:00-05:00"]));
      }
      static now() {
        return new NativeDate("2026-09-10T10:42:00-05:00").valueOf();
      }
    }
    // Deterministic metadata is part of the approved visual contract.
    window.Date = VisualDate as DateConstructor;
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/company/users/") && detail === "loading") {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      return;
    }
    if (path.includes("/company/users/") && detail === "error") {
      await route.fulfill({
        status: 500,
        contentType: "application/problem+json",
        body: JSON.stringify({
          title: "No pudimos cargar el usuario",
          status: 500,
        }),
      });
      return;
    }
    if (path.endsWith("/company/users") && listLoading) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      return;
    }
    const body = path.endsWith("/me")
      ? current.user
      : path.endsWith("/company/users")
        ? {
            items,
            page: { page: 0, pageSize: 5, totalElements: 128, totalPages: 26 },
          }
        : path.includes("/company/users/")
          ? items[0]
          : current;
    await route.fulfill({
      status: path.endsWith("/company/users") ? status : 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.goto("/");
  await page
    .getByLabel("Correo o nombre de usuario")
    .fill("alex.medina@comercialandina.example");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto("/company/administrators-supervisors");
  await expect(
    page.getByRole("heading", { name: "Administradores y supervisores" }),
  ).toBeVisible();
  if (status === 200 && !listLoading)
    await expect(
      page.getByText(items[0]?.displayName ?? "Aún no hay usuarios"),
    ).toBeVisible();
  else if (status === 403)
    await expect(
      page.getByRole("heading", { name: "No tienes permisos" }),
    ).toBeVisible();
  if (items.length === 5 && !listLoading) {
    await expect(page.locator(".company-users [aria-busy='true']")).toHaveCount(
      0,
    );
    await expect(page.getByText("Resultados", { exact: true })).toBeVisible();
    await expect(page.locator(".company-users tbody tr")).toHaveCount(5);
    await expect(
      page.getByText(/Mostrando 1.*5 de 128 usuarios/),
    ).toBeVisible();
  }
}

const variants = [
  ["ready-admin", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["tablet", 900, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["mobile-390", 390, 844, "COMPANY_ADMIN", 200, readyUsers],
  ["mobile-360", 360, 800, "COMPANY_ADMIN", 200, readyUsers],
  ["dark", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["empty", 1440, 900, "COMPANY_ADMIN", 200, []],
  ["no-results", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["error", 1440, 900, "COMPANY_ADMIN", 500, []],
  ["forbidden", 1440, 900, "COMPANY_ADMIN", 403, []],
  ["readonly", 1440, 900, "SUPERVISOR", 200, readyUsers],
  ["menu-active", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  [
    "menu-invited",
    1440,
    900,
    "COMPANY_ADMIN",
    200,
    [{ ...user, status: "INVITED" }],
  ],
  ["invite", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["edit", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["resend", 1440, 900, "COMPANY_ADMIN", 200, [{ ...user, status: "INVITED" }]],
  ["detail", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["pagination", 1440, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["filters", 900, 900, "COMPANY_ADMIN", 200, readyUsers],
  ["mobile-menu", 390, 844, "COMPANY_ADMIN", 200, readyUsers],
] as const;

for (const [name, width, height, role, status, items] of variants)
  test(`FE-004 ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, role, status, items);
    if (name === "dark")
      await page.getByRole("switch", { name: "Modo oscuro" }).click();
    if (name === "mobile-menu")
      await page.getByRole("button", { name: "Abrir menú" }).click();
    if (name === "invite")
      await page.getByRole("button", { name: /Invitar administrador/ }).click();
    if (name === "menu-active" || name === "edit" || name === "detail")
      await page
        .getByRole("button", { name: /Más acciones/ })
        .first()
        .click();
    if (name === "menu-invited" || name === "resend")
      await page
        .getByRole("button", { name: /Más acciones/ })
        .first()
        .click();
    if (name === "no-results") {
      await page
        .getByRole("searchbox", { name: "Buscar" })
        .fill("sin-coincidencias");
    }
    if (name === "edit")
      await page.getByRole("menuitem", { name: "Editar usuario" }).click();
    if (name === "resend")
      await page
        .getByRole("menuitem", { name: "Corregir y reenviar invitación" })
        .click();
    if (name === "detail")
      await page.getByRole("menuitem", { name: "Ver detalle" }).click();
    if (name === "pagination")
      await expect(page.locator(".data-table__ellipsis")).toBeVisible();
    if (name === "empty")
      await expect(
        page
          .locator(".async-state-card")
          .getByRole("button", { name: "Invitar administrador o supervisor" })
          .locator("svg"),
      ).toBeVisible();
    if (
      ["ready-admin", "tablet", "mobile-390", "mobile-360", "dark"].includes(
        name,
      )
    )
      await expectContinuousTablePanel(page);
    await expect(
      name === "forbidden"
        ? page.getByRole("main")
        : page.locator(".company-users"),
    ).toBeVisible();
    await expect(page).toHaveScreenshot(`fe-004-${name}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

test("FE-004 loading inicial", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "COMPANY_ADMIN", 200, readyUsers, "ready", true);
  await expect(page.locator(".company-users [aria-busy='true']")).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Cargando usuarios" }),
  ).toBeVisible();
  await expect(
    page.locator(".table-loading-indicator__skeleton > div"),
  ).toHaveCount(5);
  await expect(
    page.locator(".table-loading-indicator__skeleton span"),
  ).toHaveCount(25);
  await expect(page).toHaveScreenshot("fe-004-loading.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("FE-004 error con datos previos conserva tabla y avisa actualización pendiente", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "COMPANY_ADMIN", 200, readyUsers);
  await page.route("**/api/company/users**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/problem+json",
      body: JSON.stringify({ status: 500 }),
    });
  });
  await page.getByRole("button", { name: "Página siguiente" }).click();
  await expect(
    page.getByText("Actualización pendiente", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".company-users tbody tr")).toHaveCount(5);
  await expect(page.getByText(/Mostrando 1.*5 de 128 usuarios/)).toBeVisible();
  await expect(page).toHaveScreenshot("fe-004-stale.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

async function openActions(
  page: Page,
  options: {
    width?: number;
    height?: number;
    users?: typeof readyUsers;
    detail?: "ready" | "loading" | "error";
    dark?: boolean;
  } = {},
) {
  await page.setViewportSize({
    width: options.width ?? 1440,
    height: options.height ?? 900,
  });
  await open(
    page,
    "COMPANY_ADMIN",
    200,
    options.users ?? readyUsers,
    options.detail ?? "ready",
  );
  if (options.dark)
    await page.getByRole("switch", { name: "Modo oscuro" }).click();
}
async function action(page: Page, label: string) {
  await page
    .getByRole("button", { name: /Más acciones/ })
    .first()
    .click();
  await page.getByRole("menuitem", { name: label }).click();
}
async function actionFor(page: Page, userName: string, label: string) {
  await page
    .getByRole("button", { name: `Más acciones para ${userName}` })
    .click();
  await page.getByRole("menuitem", { name: label }).click();
}
async function overlaySnapshot(page: Page, name: string, heading: string) {
  await expect(page.locator("[role=dialog], [role=alertdialog]")).toBeVisible();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
}

async function expectGoldenConfirmationGeometry(
  page: Page,
  mobile = false,
  dark = false,
) {
  const dialog = page.getByRole("alertdialog");
  const layer = dialog.locator("..");
  const header = dialog.locator("header");
  const body = dialog.locator(".confirmation-dialog__content");
  const close = dialog.getByRole("button", { name: "Cerrar confirmación" });
  const cancel = dialog.getByRole("button", { name: "Cancelar" });
  const primary = dialog.locator(".operation-dialog__primary");
  const footer = dialog.locator("footer");
  await expect(dialog).toHaveCSS("position", "fixed");
  await expect(dialog).toHaveCSS("border-top-left-radius", "22px");
  await expect(header).toHaveCSS("padding-left", "22px");
  await expect(header).toHaveCSS("padding-right", "22px");
  await expect(header).toHaveCSS("padding-top", "20px");
  await expect(header).toHaveCSS("padding-bottom", "16px");
  await expect(header).toHaveCSS("border-bottom-width", "1px");
  await expect(body).toHaveCSS("padding-top", "20px");
  await expect(body).toHaveCSS("padding-right", "22px");
  await expect(body).toHaveCSS("padding-bottom", "20px");
  await expect(body).toHaveCSS("padding-left", "22px");
  await expect(close).toHaveCSS("width", "44px");
  await expect(close).toHaveCSS("height", "44px");
  await expect(close).toHaveCSS("border-top-width", "1px");
  await expect(layer).toHaveCSS(
    "background-color",
    dark ? "rgba(2, 6, 23, 0.68)" : "rgba(15, 23, 42, 0.42)",
  );
  await expect(footer).toHaveCSS("padding-left", "22px");
  await expect(primary).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(cancel).toBeFocused();
  expect(
    await cancel.evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toBe("none");
  if (mobile) {
    await expect(dialog).toHaveCSS("bottom", "0px");
    await expect(dialog).toHaveCSS(
      "width",
      `${page.viewportSize()?.width ?? 390}px`,
    );
    await expect(dialog).toHaveCSS("border-bottom-left-radius", "0px");
    await expect(dialog).toHaveCSS("border-bottom-right-radius", "0px");
    await expect(footer).toHaveCSS("display", "grid");
  } else {
    await expect(dialog).toHaveCSS("width", "480px");
    await expect(footer).toHaveCSS("display", "flex");
  }
  const labels = await footer.getByRole("button").allTextContents();
  expect(labels[0]).toBe("Cancelar");
}

async function expectContinuousTablePanel(page: Page) {
  const geometry = await page
    .locator(".company-users__card")
    .evaluate((panel) => {
      const footer = panel.querySelector<HTMLElement>(
        ".data-table__pagination--golden",
      );
      const table = panel.querySelector<HTMLElement>(".data-table__wrap");
      if (!footer || !table) throw new Error("Panel ready incompleto");
      const panelStyle = getComputedStyle(panel);
      const footerStyle = getComputedStyle(footer);
      const panelBox = panel.getBoundingClientRect();
      const footerBox = footer.getBoundingClientRect();
      const tableBox = table.getBoundingClientRect();
      return {
        radius: panelStyle.borderTopLeftRadius,
        overflow: panelStyle.overflow,
        position: footerStyle.position,
        shadow: footerStyle.boxShadow,
        margin: [
          footerStyle.marginTop,
          footerStyle.marginRight,
          footerStyle.marginBottom,
          footerStyle.marginLeft,
        ],
        borders: [
          footerStyle.borderTopWidth,
          footerStyle.borderRightWidth,
          footerStyle.borderBottomWidth,
          footerStyle.borderLeftWidth,
        ],
        transform: footerStyle.transform,
        contained:
          footerBox.left >= panelBox.left &&
          footerBox.right <= panelBox.right &&
          footerBox.top >= panelBox.top &&
          footerBox.bottom <= panelBox.bottom,
        bottomDelta: Math.abs(panelBox.bottom - footerBox.bottom),
        tableGap: Math.abs(footerBox.top - tableBox.bottom),
      };
    });
  expect(geometry.radius).toBe("16px");
  expect(geometry.overflow).toBe("hidden");
  expect(geometry.position).toBe("static");
  expect(geometry.shadow).toBe("none");
  expect(geometry.margin).toEqual(["0px", "0px", "0px", "0px"]);
  expect(geometry.borders).toEqual(["1px", "0px", "0px", "0px"]);
  expect(geometry.transform).toBe("none");
  expect(geometry.contained).toBe(true);
  expect(geometry.bottomDelta).toBeLessThanOrEqual(1);
  expect(geometry.tableGap).toBeLessThanOrEqual(1);
}

test("FE-004 invite desktop reference", async ({ page }) => {
  await openActions(page);
  await page.getByRole("button", { name: /Invitar administrador/ }).click();
  await overlaySnapshot(
    page,
    "fe-004-invite-desktop",
    "Invitar administrador o supervisor",
  );
});
test("FE-004 invite mobile reference", async ({ page }) => {
  await openActions(page, { width: 390, height: 844 });
  await page.getByRole("button", { name: /Invitar administrador/ }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("width", "390px");
  await overlaySnapshot(
    page,
    "fe-004-invite-mobile",
    "Invitar administrador o supervisor",
  );
});
test("FE-004 invite dark reference", async ({ page }) => {
  await openActions(page, { dark: true });
  await page.getByRole("button", { name: /Invitar administrador/ }).click();
  await overlaySnapshot(
    page,
    "fe-004-invite-dark",
    "Invitar administrador o supervisor",
  );
});
test("FE-004 edit desktop reference", async ({ page }) => {
  await openActions(page);
  await action(page, "Editar usuario");
  await overlaySnapshot(
    page,
    "fe-004-edit-desktop",
    "Editar administrador o supervisor",
  );
});
test("FE-004 detail loading desktop reference", async ({ page }) => {
  await openActions(page, { detail: "loading" });
  await action(page, "Ver detalle");
  await overlaySnapshot(
    page,
    "fe-004-detail-loading-desktop",
    "Detalle de usuario",
  );
  await expect(page.getByText("Cargando detalle")).toBeVisible();
});
test("FE-004 detail ready desktop reference", async ({ page }) => {
  await openActions(page);
  await action(page, "Ver detalle");
  await overlaySnapshot(
    page,
    "fe-004-detail-ready-desktop",
    "Detalle de usuario",
  );
  await expect(
    page.getByRole("dialog").getByText("Marina Torres"),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").locator(".company-users__detail-grid > div"),
  ).toHaveCount(4);
});
test("FE-004 detail error desktop reference", async ({ page }) => {
  await openActions(page, { detail: "error" });
  await action(page, "Ver detalle");
  await overlaySnapshot(
    page,
    "fe-004-detail-error-desktop",
    "Detalle de usuario",
  );
  await expect(page.getByText("No pudimos cargar el usuario")).toBeVisible();
});
test("FE-004 confirm block desktop reference", async ({ page }) => {
  await openActions(page);
  await actionFor(page, "Julián Quispe", "Bloquear usuario");
  await expectGoldenConfirmationGeometry(page);
  await overlaySnapshot(
    page,
    "fe-004-confirm-block-desktop",
    "Bloquear usuario",
  );
});
test("FE-004 confirm block mobile reference", async ({ page }) => {
  await openActions(page, { width: 390, height: 844 });
  await actionFor(page, "Julián Quispe", "Bloquear usuario");
  await page.evaluate(() => scrollTo(0, 0));
  await expectGoldenConfirmationGeometry(page, true);
  await overlaySnapshot(
    page,
    "fe-004-confirm-block-mobile",
    "Bloquear usuario",
  );
});
test("FE-004 confirm block mobile 360 geometry", async ({ page }) => {
  await openActions(page, { width: 360, height: 800 });
  await actionFor(page, "Julián Quispe", "Bloquear usuario");
  await expectGoldenConfirmationGeometry(page, true);
});
test("FE-004 confirm block dark reference", async ({ page }) => {
  await openActions(page, { dark: true });
  await actionFor(page, "Julián Quispe", "Bloquear usuario");
  await expectGoldenConfirmationGeometry(page, false, true);
  await overlaySnapshot(page, "fe-004-confirm-block-dark", "Bloquear usuario");
});
test("FE-004 confirm reactivate desktop reference", async ({ page }) => {
  await openActions(page);
  await actionFor(page, "Diego Salas", "Reactivar usuario");
  await expectGoldenConfirmationGeometry(page);
  await expect(
    page.getByText(
      "Diego Salas recuperará el acceso correspondiente a su rol de Administrador.",
    ),
  ).toBeVisible();
  await overlaySnapshot(
    page,
    "fe-004-confirm-reactivate-desktop",
    "Reactivar usuario",
  );
});
