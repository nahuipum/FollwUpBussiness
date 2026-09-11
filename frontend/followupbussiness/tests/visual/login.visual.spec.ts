import { expect, test, type Page } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const tablet = { width: 768, height: 1024 };
const mobile = { width: 390, height: 844 };
const consoleIssues = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const issues: string[] = [];
  consoleIssues.set(page, issues);
  page.on("console", (message) => {
    const text = message.text();
    const isExpectedHttpFailure = text.startsWith("Failed to load resource: the server responded with a status of");
    if (!isExpectedHttpFailure && (message.type() === "error" || message.type() === "warning")) issues.push(text);
  });
});

test.afterEach(async ({ page }) => {
  expect(consoleIssues.get(page) ?? []).toEqual([]);
});

async function openLogin(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
}

async function fillCredentials(page: Page) {
  await page.locator("#identifier").fill("usuario@empresa.com");
  await page.locator("#password").fill("FollowUpDemo1!");
}

async function expectStableLogin(page: Page, name: string) {
  await page.addStyleTag({ content: "*, *::before, *::after { caret-color: transparent !important; }" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".login-golden__field-icon")).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Mostrar|Ocultar contraseña/ })).toBeVisible();
  await expect(page.locator(".auth-secure-footer")).toBeVisible();
  const logo = page.locator(".login-golden__brand-logo:visible, .login-golden__mobile-logo:visible");
  await expect(logo).toHaveCount(1);
  expect(await logo.evaluate((image: HTMLImageElement) => {
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const renderedRatio = image.getBoundingClientRect().width / image.getBoundingClientRect().height;
    return image.complete && image.naturalWidth > 0 && Math.abs(naturalRatio - renderedRatio) < 0.02;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    fullPage: true,
  });
}

async function mockPendingLogin(page: Page) {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/auth/login", async (route) => {
    await gate;
    await route.fulfill({ status: 400, body: "" });
  });
  return () => release?.();
}

test("ready desktop", async ({ page }) => {
  await openLogin(page, desktop);
  await expectStableLogin(page, "login-ready-desktop.png");
});

test("focus ring belongs only to the field control", async ({ page }) => {
  await openLogin(page, desktop);
  const password = page.locator("#password");
  const control = password.locator("..");

  await password.click();

  await expect(password).toHaveCSS("outline-width", "0px");
  await expect(password).toHaveCSS("box-shadow", "none");
  expect(await control.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
  await expectStableLogin(page, "login-focus-desktop.png");
});

test("validation desktop", async ({ page }) => {
  await openLogin(page, desktop);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator("#identifier")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#password")).toHaveAttribute("aria-invalid", "true");
  await expectStableLogin(page, "login-validation-desktop.png");
});

test("loading desktop", async ({ page }) => {
  const release = await mockPendingLogin(page);
  await openLogin(page, desktop);
  await fillCredentials(page);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciando sesión…" })).toBeDisabled();
  try {
    await expectStableLogin(page, "login-loading-desktop.png");
  } finally {
    release();
  }
});

test("auth error desktop", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.fulfill({ status: 400, body: "" }));
  await openLogin(page, desktop);
  await fillCredentials(page);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("dialog", { name: "Inicio de sesión fallido" })).toBeVisible();
  await expectStableLogin(page, "login-auth-error-desktop.png");
});

test("retry desktop", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.fulfill({ status: 429, headers: { "Retry-After": "24" }, body: "" }));
  await openLogin(page, desktop);
  await fillCredentials(page);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("dialog", { name: "Inicio de sesión fallido" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("status")).toContainText("24 segundos");
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
  await expectStableLogin(page, "login-retry-desktop.png");
});

test("invalid session desktop", async ({ page }) => {
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, body: "" }));
  await page.setViewportSize(desktop);
  await page.goto("/seller/dashboard");
  await expect(page.getByRole("dialog", { name: "Tu sesión terminó" })).toBeVisible();
  await expectStableLogin(page, "login-invalid-session-desktop.png");
});

test("ready tablet", async ({ page }) => {
  await openLogin(page, tablet);
  await expect(page.locator(".login-golden__brand")).toBeVisible();
  await expectStableLogin(page, "login-ready-tablet.png");
});

test("ready mobile", async ({ page }) => {
  await openLogin(page, mobile);
  await expect(page.locator(".login-golden__brand")).toHaveCount(0);
  await expectStableLogin(page, "login-ready-mobile.png");
});

test("validation mobile", async ({ page }) => {
  await openLogin(page, mobile);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator("#identifier")).toHaveAttribute("aria-describedby", "identifier-error");
  await expect(page.locator("#password")).toHaveAttribute("aria-describedby", "password-error");
  await expectStableLogin(page, "login-validation-mobile.png");
});

test("loading mobile", async ({ page }) => {
  const release = await mockPendingLogin(page);
  await openLogin(page, mobile);
  await fillCredentials(page);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciando sesión…" })).toBeDisabled();
  try {
    await expectStableLogin(page, "login-loading-mobile.png");
  } finally {
    release();
  }
});
