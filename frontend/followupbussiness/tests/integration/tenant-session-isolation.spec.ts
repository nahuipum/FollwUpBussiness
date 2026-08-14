import { expect, test, type Page, type Response } from "@playwright/test";

type Identity = Readonly<{ id: string; company: unknown }>;
type CompanyUser = Readonly<{ id: string; email: string }>;

const credentials = {
  a: { identifier: process.env.USER_TENANT_A, password: process.env.PASSWORD_TENANT_A },
  b: { identifier: process.env.USER_TENANT_B, password: process.env.PASSWORD_TENANT_B },
} as const;
const hasLocalCredentials = Object.values(credentials).every(
  (credential) => Boolean(credential.identifier && credential.password),
);
const companyUsersPattern = "**/api/company/users?**";

function isIdentity(value: unknown): value is Identity {
  return typeof value === "object" && value !== null &&
    typeof (value as { id?: unknown }).id === "string" && "company" in value;
}

function usersFrom(value: unknown): readonly CompanyUser[] {
  if (typeof value !== "object" || value === null || !Array.isArray((value as { items?: unknown }).items)) {
    throw new Error("La respuesta de usuarios no tiene el contrato esperado.");
  }
  const users = (value as { items: unknown[] }).items;
  if (!users.every((user) => typeof user === "object" && user !== null &&
    typeof (user as { id?: unknown }).id === "string" &&
    typeof (user as { email?: unknown }).email === "string")) {
    throw new Error("La lista de usuarios contiene un elemento sin el contrato esperado.");
  }
  return users as CompanyUser[];
}

async function login(page: Page, credential: { identifier: string | undefined; password: string | undefined }) {
  if (!credential.identifier || !credential.password) throw new Error("Faltan credenciales locales de integración.");
  await page.goto("/");
  const loginResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/auth/login",
  );
  const me = page.waitForResponse((response) =>
    response.request().method() === "GET" && new URL(response.url()).pathname === "/api/me",
  );
  await page.locator("#identifier").fill(credential.identifier);
  await page.locator("#password").fill(credential.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  expect((await loginResponse).status()).toBe(200);
  const body: unknown = await (await me).json();
  if (!isIdentity(body)) throw new Error("/me no devolvió la identidad esperada.");
  return body;
}

async function navigateClient(page: Page, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function openCompanyUsers(page: Page): Promise<{ response: Response; users: readonly CompanyUser[] }> {
  const usersResponse = page.waitForResponse((response) =>
    response.request().method() === "GET" && new URL(response.url()).pathname === "/api/company/users",
  );
  await navigateClient(page, "/company/administrators-supervisors");
  await expect(page.getByRole("heading", { name: "Administradores y supervisores" })).toBeVisible();
  const response = await usersResponse;
  expect(response.status()).toBe(200);
  expect(await response.request().headerValue("authorization")).toMatch(/^Bearer\s+.+/);
  return { response, users: usersFrom(await response.json()) };
}

type SessionReplay = Readonly<{ csrf: string; cookie: string }>;

async function captureSessionReplay(page: Page): Promise<SessionReplay> {
  const csrf = await page.evaluate(() => {
    const csrf = sessionStorage.getItem("followupbusiness.csrf-token");
    if (csrf === null) throw new Error("No existe CSRF de sesión WEB.");
    return csrf;
  });
  const cookies = await page.context().cookies();
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
  if (cookie === "") throw new Error("No existe cookie WEB para la sesión.");
  return { csrf, cookie };
}

async function logoutAndAssertCleanup(page: Page, bearer: string) {
  const logoutResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/auth/logout",
  );
  await page.getByRole("button", { name: "Cerrar sesión" }).first().click();
  expect((await logoutResponse).status()).toBe(204);
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    csrf: sessionStorage.getItem("followupbusiness.csrf-token"),
    bearerPersisted: [...Object.values(localStorage), ...Object.values(sessionStorage)]
      .some((value) => /^Bearer\s+/i.test(value)),
  }))).toEqual({ csrf: null, bearerPersisted: false });
  const rejected = await page.request.get("/api/me", { headers: { Authorization: bearer } });
  expect(rejected.status()).toBe(401);
}

async function replayLogout(page: Page, replay: SessionReplay, bearer: string) {
  const response = await page.request.post("/api/auth/logout", {
    headers: {
      Authorization: bearer,
      "X-CSRF-Token": replay.csrf,
      Cookie: replay.cookie,
    },
  });
  expect(response.status()).toBe(401);
}

test.describe("INT-024: aislamiento de sesión WEB con API real", () => {
  test.skip(!hasLocalCredentials, "Requiere USER_TENANT_A/B y PASSWORD_TENANT_A/B locales; no usa credenciales versionadas.");

  test("A→B y B→A limpian credenciales y descartan una respuesta A tardía", async ({ page }) => {
    const identityA = await login(page, credentials.a);
    let delayedResponseRelease: (() => void) | undefined;
    const intercepted = new Promise<Readonly<{ users: readonly CompanyUser[]; bearer: string }>>((resolve, reject) => {
      void page.route(companyUsersPattern, async (route) => {
        await page.unroute(companyUsersPattern);
        const bearer = await route.request().headerValue("authorization");
        if (bearer === null) {
          await route.abort();
          reject(new Error("No existe Bearer WEB para A."));
          return;
        }
        const response = await route.fetch(); // Respuesta del backend real; se demora únicamente su entrega al navegador.
        resolve({ users: usersFrom(await response.json()), bearer });
        await new Promise<void>((release) => { delayedResponseRelease = release; });
        await route.fulfill({ response }).catch(() => undefined);
      });
    });

    await navigateClient(page, "/company/administrators-supervisors");
    const interceptedA = await intercepted;
    const listA = interceptedA.users;
    const bearerA = interceptedA.bearer;
    const replayA = await captureSessionReplay(page);
    await logoutAndAssertCleanup(page, bearerA);
    await replayLogout(page, replayA, bearerA);

    const identityB = await login(page, credentials.b);
    expect(identityB.id).not.toBe(identityA.id);
    const listB = await openCompanyUsers(page);
    const bearerB = await listB.response.request().headerValue("authorization");
    if (bearerB === null) throw new Error("No existe Bearer WEB para B.");
    const replayB = await captureSessionReplay(page);
    expect(listB.users.map((user) => user.id)).not.toEqual(listA.map((user) => user.id));

    delayedResponseRelease?.();
    await page.waitForTimeout(150);
    await expect(page).toHaveURL(/\/company\/administrators-supervisors$/);
    for (const user of listB.users) await expect(page.getByText(user.email, { exact: true })).toHaveCount(1);
    for (const user of listA) await expect(page.getByText(user.email, { exact: true })).toHaveCount(0);

    await logoutAndAssertCleanup(page, bearerB);
    await replayLogout(page, replayB, bearerB);
    const identityAAgain = await login(page, credentials.a);
    expect(identityAAgain.id).toBe(identityA.id);
    const listAAgain = await openCompanyUsers(page);
    const bearerAAgain = await listAAgain.response.request().headerValue("authorization");
    if (bearerAAgain === null) throw new Error("No existe Bearer WEB renovado para A.");
    expect((await page.request.get("/api/me", { headers: { Authorization: bearerA } })).status()).toBe(401);
    expect((await page.request.get("/api/me", { headers: { Authorization: bearerAAgain } })).status()).toBe(200);
    expect(listAAgain.users.map((user) => user.id)).not.toEqual(listB.users.map((user) => user.id));
    for (const user of listB.users) await expect(page.getByText(user.email, { exact: true })).toHaveCount(0);
  });
});
