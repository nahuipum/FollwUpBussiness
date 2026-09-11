import { expect, test, type Page } from "@playwright/test";
type Role = "COMPANY_ADMIN" | "SUPERVISOR" | "PLATFORM_SUPERADMIN";
const company = {
  id: "00000000-0000-4000-8000-000000000002",
  legalName: "Empresa visual",
};
function session(role: Role) {
  return {
    channel: "WEB",
    credentials: {
      accessToken: `visual-${role}`,
      tokenType: "Bearer",
      expiresIn: 600,
    },
    csrfToken: "c".repeat(43),
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      displayName:
        role === "PLATFORM_SUPERADMIN"
          ? "Plataforma visual"
          : role === "SUPERVISOR"
            ? "Supervisor visual"
            : "Administradora visual",
      email: "visual@example.test",
      status: "ACTIVE",
      roles: [role],
      company: role === "PLATFORM_SUPERADMIN" ? null : company,
    },
  };
}
async function openWorkspace(page: Page, role: Role, path: string) {
  const current = session(role);
  await page.route("**/api/**", async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(endpoint.endsWith("/me") ? current.user : current),
    });
  });
  await page.goto("/");
  await page
    .getByLabel("Correo o nombre de usuario")
    .fill("visual@example.test");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator(".dashboard-shell")).toBeVisible();
  await page.goto(path);
  await expect(page.locator(".dashboard-shell")).toBeVisible();
}
test("dashboard empresa desktop inicial cerrado", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/dashboard");
  await expect(
    page.getByRole("button", { name: "Clientes", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", {
      name: "Abrir opciones del perfil de Administradora visual",
    }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveScreenshot("company-dashboard-desktop.png", {
    animations: "disabled",
  });
});
test("dashboard empresa desktop con Clientes y perfil", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/dashboard");
  await page.getByRole("button", { name: "Clientes", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Abrir opciones del perfil de Administradora visual",
    })
    .click();
  await expect(page).toHaveScreenshot(
    "company-dashboard-desktop-clients-profile.png",
    { animations: "disabled" },
  );
});
test("dashboard empresa tablet", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/dashboard");
  await expect(page).toHaveScreenshot("company-dashboard-tablet.png", {
    animations: "disabled",
  });
});
test("dashboard empresa móvil y drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/dashboard");
  await expect(page).toHaveScreenshot("company-dashboard-mobile.png", {
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.locator(".dashboard-menu-button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page).toHaveScreenshot("company-dashboard-mobile-drawer.png", {
    animations: "disabled",
  });
});
test("dashboard empresa oscuro", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/dashboard");
  await page.getByRole("switch", { name: "Modo oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page).toHaveScreenshot("company-dashboard-dark.png", {
    animations: "disabled",
  });
});
test("Clientes dentro del shell de empresa", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/clients");
  await expect(
    page.getByRole("heading", { name: "Clientes", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("company-clients-shell.png", {
    animations: "disabled",
  });
});
test("Rutas dentro del shell de empresa", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "COMPANY_ADMIN", "/company/routes");
  await expect(
    page.getByRole("heading", { name: "Rutas", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("company-routes-shell.png", {
    animations: "disabled",
  });
});
test("shell supervisor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "SUPERVISOR", "/supervisor/dashboard");
  await expect(page).toHaveScreenshot("supervisor-shell.png", {
    animations: "disabled",
  });
});
test("shell plataforma", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page, "PLATFORM_SUPERADMIN", "/platform/dashboard");
  await expect(page).toHaveScreenshot("platform-shell.png", {
    animations: "disabled",
  });
});
