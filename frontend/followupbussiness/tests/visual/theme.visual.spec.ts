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
    displayName: "Usuario visual",
    email: "visual@example.test",
    status: "ACTIVE",
    roles: ["PLATFORM_SUPERADMIN"],
    company: null,
  },
};

async function mockSession(page: Page) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/me")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) });
      return;
    }

    if (path.endsWith("/platform/companies")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], page: { page: 0, pageSize: 20, totalElements: 0, totalPages: 0 } }),
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
  test(`modo oscuro ${viewport.name}: menú de perfil y persistencia visual`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockSession(page);
    await page.goto("/");
    await page.getByLabel("Correo o nombre de usuario").fill("visual@example.test");
    await page.locator("#password").fill("correct-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("heading", { name: "Aún no hay empresas creadas" })).toBeVisible();

    const profileButton = page.getByRole("button", { name: "Abrir opciones del perfil de Usuario visual" });
    await expect(profileButton).toBeVisible();
    await profileButton.click();
    const themeOption = page.getByRole("menuitemcheckbox", { name: /Modo oscuro/ });
    await expect(themeOption).toHaveAttribute("aria-checked", "false");
    await themeOption.click();

    await expect(themeOption).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".dashboard-shell")).toHaveCSS("background-color", "rgb(8, 17, 31)");
    expect(await page.evaluate(() => window.localStorage.getItem("followupbusiness.theme"))).toBe("dark");
    await page.screenshot({ path: `test-results/visual/theme-${viewport.name}-dark.png`, fullPage: true, animations: "disabled" });

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Abrir opciones del perfil de Usuario visual" })).toBeVisible();
  });
}
