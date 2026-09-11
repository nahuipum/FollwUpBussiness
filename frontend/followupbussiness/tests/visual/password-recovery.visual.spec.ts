import { expect, test, type Page } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const tablet = { width: 768, height: 1024 };
const mobile = { width: 390, height: 844 };
const syntheticToken = "v".repeat(43);
const syntheticEmail = "visual-test@company.example";
const syntheticPassword = "VisualOnly1!";
const passwordApiPattern = "**/api/auth/password-*";
const consoleIssues = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const issues: string[] = [];
  consoleIssues.set(page, issues);
  page.on("console", (message) => {
    const messageText = message.text();
    const isExpectedHttpFailure = messageText.startsWith(
      "Failed to load resource: the server responded with a status of",
    );
    if (
      !isExpectedHttpFailure &&
      (message.type() === "error" || message.type() === "warning")
    )
      issues.push(messageText);
  });
});

test.afterEach(async ({ page }) => {
  expect(consoleIssues.get(page) ?? []).toEqual([]);
});

async function openRecovery(
  page: Page,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.goto("/password-recovery");
  await expect(
    page.getByRole("heading", { name: "¿Olvidaste tu contraseña?" }),
  ).toBeVisible();
}

async function openReset(
  page: Page,
  viewport: { width: number; height: number } = desktop,
) {
  await page.setViewportSize(viewport);
  await page.goto(`/password-reset?token=${syntheticToken}`);
  await expect(
    page.getByRole("heading", { name: "Crea una nueva contraseña" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/password-reset$/);
}

async function fillReset(page: Page, confirmation = syntheticPassword) {
  await page.locator("#new-password").fill(syntheticPassword);
  await page.locator("#confirm-password").fill(confirmation);
}

async function mockResponse(
  page: Page,
  status: number,
  headers?: Record<string, string>,
) {
  await page.route(passwordApiPattern, (route) =>
    route.fulfill({ status, headers, body: "" }),
  );
}

async function mockPendingResponse(page: Page, finalStatus = 500) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(passwordApiPattern, async (route) => {
    await gate;
    await route.fulfill({ status: finalStatus, body: "" });
  });
  return release;
}

async function expectStableRecovery(page: Page, name: string) {
  await page.addStyleTag({
    content: "*, *::before, *::after { caret-color: transparent !important; }",
  });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".auth-secure-footer")).toBeVisible();

  const logo = page.locator(
    ".login-golden__brand-logo:visible, .login-golden__mobile-logo:visible",
  );
  await expect(logo).toHaveCount(1);
  expect(
    await logo.evaluate((image: HTMLImageElement) => {
      const naturalRatio = image.naturalWidth / image.naturalHeight;
      const renderedRatio =
        image.getBoundingClientRect().width /
        image.getBoundingClientRect().height;
      return (
        image.complete &&
        image.naturalWidth > 0 &&
        Math.abs(naturalRatio - renderedRatio) < 0.02
      );
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    fullPage: true,
  });
}

test("request ready desktop", async ({ page }) => {
  await openRecovery(page, desktop);
  await expect(page.locator(".login-golden__brand")).toBeVisible();
  await expect(page.locator(".login-golden__map-card")).toBeVisible();
  await expectStableRecovery(
    page,
    "password-recovery-request-ready-desktop.png",
  );
});

test("request ready tablet", async ({ page }) => {
  await openRecovery(page, tablet);
  await expect(page.locator(".login-golden__brand")).toBeVisible();
  await expectStableRecovery(
    page,
    "password-recovery-request-ready-tablet.png",
  );
});

test("request ready mobile", async ({ page }) => {
  await openRecovery(page, mobile);
  await expect(page.locator(".login-golden__brand")).toHaveCount(0);
  await expectStableRecovery(
    page,
    "password-recovery-request-ready-mobile.png",
  );
});

test("request validation", async ({ page }) => {
  await openRecovery(page, desktop);
  await page
    .getByRole("button", { name: "Enviar enlace de recuperación" })
    .click();
  await expect(page.locator("#recovery-email")).toHaveAttribute(
    "aria-describedby",
    "recovery-email-error",
  );
  await expect(page.locator("#recovery-email")).toBeFocused();
  await expectStableRecovery(page, "password-recovery-request-validation.png");
});

test("request loading", async ({ page }) => {
  const release = await mockPendingResponse(page);
  await openRecovery(page, desktop);
  await page.locator("#recovery-email").fill(syntheticEmail);
  await page
    .getByRole("button", { name: "Enviar enlace de recuperación" })
    .click();
  await expect(
    page.getByRole("button", { name: "Enviando solicitud..." }),
  ).toBeDisabled();
  try {
    await expectStableRecovery(page, "password-recovery-request-loading.png");
  } finally {
    release();
  }
});

test("request generic error", async ({ page }) => {
  await mockResponse(page, 418);
  await openRecovery(page, desktop);
  await page.locator("#recovery-email").fill(syntheticEmail);
  await page
    .getByRole("button", { name: "Enviar enlace de recuperación" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ocurrió un problema temporal" }),
  ).toBeVisible();
  await expectStableRecovery(page, "password-recovery-request-error.png");
});

test("request unavailable", async ({ page }) => {
  await mockResponse(page, 503);
  await openRecovery(page, desktop);
  await page.locator("#recovery-email").fill(syntheticEmail);
  await page
    .getByRole("button", { name: "Enviar enlace de recuperación" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Servicio no disponible" }),
  ).toBeVisible();
  await expectStableRecovery(page, "password-recovery-request-unavailable.png");
});

test("request cooldown", async ({ page }) => {
  await mockResponse(page, 429, { "Retry-After": "30" });
  await openRecovery(page, desktop);
  await page.locator("#recovery-email").fill(syntheticEmail);
  await page
    .getByRole("button", { name: "Enviar enlace de recuperación" })
    .click();
  await expect(page.getByRole("status")).toContainText("30 segundos");
  await expect(
    page.getByRole("button", { name: "Espera 30 s" }),
  ).toBeDisabled();
  await expectStableRecovery(page, "password-recovery-request-cooldown.png");
});

test("confirmation", async ({ page }) => {
  await page.setViewportSize(desktop);
  await page.goto("/password-recovery/confirmation");
  await expect(
    page.getByRole("heading", { name: "Revisa tu correo" }),
  ).toBeFocused();
  await expectStableRecovery(page, "password-recovery-confirmation.png");
});

test("reset ready desktop", async ({ page }) => {
  await openReset(page);
  await expect(
    page.getByRole("list", { name: "Reglas de contraseña" }),
  ).toBeVisible();
  await expectStableRecovery(page, "password-recovery-reset-ready-desktop.png");
});

test("reset ready mobile", async ({ page }) => {
  await openReset(page, mobile);
  await expect(page.locator(".login-golden__brand")).toHaveCount(0);
  await expectStableRecovery(page, "password-recovery-reset-ready-mobile.png");
});

test("reset validation", async ({ page }) => {
  await openReset(page);
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(page.locator("#new-password")).toHaveAttribute(
    "aria-describedby",
    "new-password-error",
  );
  await expect(page.locator("#new-password")).toBeFocused();
  await expectStableRecovery(page, "password-recovery-reset-validation.png");
});

test("reset password visibility and matching rules", async ({ page }) => {
  await openReset(page);
  await fillReset(page);
  await page.getByRole("button", { name: "Mostrar nueva contraseña" }).click();
  await expect(page.locator("#new-password")).toHaveAttribute("type", "text");
  await expect(page.getByText("Las contraseñas coinciden.")).toBeVisible();
  await expect(page.locator(".recovery-golden__rule.is-valid")).toHaveCount(5);
  await expectStableRecovery(page, "password-recovery-reset-rules-visible.png");
});

test("reset mismatch", async ({ page }) => {
  await openReset(page);
  await fillReset(page, "VisualOnly2!");
  await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
  await expectStableRecovery(page, "password-recovery-reset-mismatch.png");
});

test("reset loading", async ({ page }) => {
  const release = await mockPendingResponse(page);
  await openReset(page);
  await fillReset(page);
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(
    page.getByRole("button", { name: "Restableciendo…" }),
  ).toBeDisabled();
  try {
    await expectStableRecovery(page, "password-recovery-reset-loading.png");
  } finally {
    release();
  }
});

test("reset error", async ({ page }) => {
  await mockResponse(page, 422);
  await openReset(page);
  await fillReset(page);
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(
    page.getByRole("heading", {
      name: "No pudimos restablecer la contraseña",
    }),
  ).toBeVisible();
  await expectStableRecovery(page, "password-recovery-reset-error.png");
});

test("token problem desktop", async ({ page }) => {
  await page.setViewportSize(desktop);
  await page.goto("/password-reset?token=malformed");
  await expect(
    page.getByRole("dialog", { name: "Enlace vencido o no disponible" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Volver al inicio de sesión" }),
  ).toBeFocused();
  await expectStableRecovery(
    page,
    "password-recovery-token-problem-desktop.png",
  );
});

test("token problem mobile", async ({ page }) => {
  await page.setViewportSize(mobile);
  await page.goto("/password-reset?token=malformed");
  await expect(
    page.getByRole("dialog", { name: "Enlace vencido o no disponible" }),
  ).toBeVisible();
  await expectStableRecovery(
    page,
    "password-recovery-token-problem-mobile.png",
  );
});

test("success", async ({ page }) => {
  await mockResponse(page, 204);
  await openReset(page);
  await fillReset(page);
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(
    page.getByRole("heading", { name: "Contraseña actualizada" }),
  ).toBeFocused();
  await expect(page).toHaveURL("/password-reset/success");
  await expectStableRecovery(page, "password-recovery-success.png");
});
