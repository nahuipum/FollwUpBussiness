import { expect, test, type Page } from '@playwright/test'

const token = 't'.repeat(43)
const passwordApiPattern = '**/*'
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

async function mockResponse(page: Page, status: number, headers?: Record<string, string>) {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await page.route(passwordApiPattern, async (route) => {
    if (route.request().url().includes('/auth/password-')) await route.fulfill(headers ? { status, headers, body: '' } : { status, body: '' })
    else await route.continue()
  })
}

async function mockPendingResponse(page: Page) {
  let release: (() => Promise<void>) | undefined
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await page.route(passwordApiPattern, async (route) => {
    if (!route.request().url().includes('/auth/password-')) return route.continue()
    await new Promise<void>((resolve) => { release = async () => { await route.fulfill({ status: 500, body: '' }); resolve() } })
  })
  return async () => release?.()
}

async function stableShot(page: Page, name: string) {
  await expect(page.locator('.auth-copyright')).toHaveText('© 2026 FollowUpBusiness')
  await page.screenshot({ path: `test-results/visual/${name}.png`, fullPage: true, animations: 'disabled' })
}

async function openReset(page: Page) {
  await page.goto(`/password-reset?token=${token}`)
  await expect(page.getByRole('heading', { name: 'Crea una nueva contraseña' })).toBeVisible()
}

async function submitReset(page: Page) {
  await page.locator('#new-password').fill('correct-password')
  await page.locator('#confirm-password').fill('correct-password')
  await page.getByRole('button', { name: 'Restablecer contraseña' }).click()
}

async function expectBrandPanelGeometry(page: Page, viewport: (typeof viewports)[number]) {
  const brandPanel = page.locator('.brand-panel')
  if (viewport.width <= 900) {
    await expect(brandPanel).toBeHidden()
    await expect(page.locator('.form-panel')).toHaveCSS('padding-left', '24px')
    expect(await page.locator('.form-panel').evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(viewport.width)
    return
  }

  await expect(brandPanel).toBeVisible()
  await expect(page.locator('.map-dots')).toBeVisible()
  await expect(page.locator('.map-card')).toBeVisible()
  await expect(page.locator('.street-map-art')).toBeVisible()
  await expect(page.locator('.map-ripple')).toHaveCount(2)
  await expect(page.locator('.map-pin')).toHaveCount(2)
  await expect(page.locator('.map-waypoint')).toBeVisible()
  expect(await page.locator('.street-map-art').evaluate((image: HTMLImageElement) => image.naturalWidth > 0)).toBe(true)
  expect(await brandPanel.evaluate((panel) => Math.round(panel.getBoundingClientRect().width))).toBe(viewport.width / 2)
  expect(await page.locator('.brand-header').evaluate((header) => {
    const rect = header.getBoundingClientRect()
    return Math.round(rect.x) === 66 && Math.round(rect.y) === 58
  })).toBe(true)
  expect(await page.locator('.map-wrap').evaluate((map) => {
    const rect = map.getBoundingClientRect()
    return Math.round(rect.x) === 66 && Math.round(rect.width) === 560 && Math.round(rect.height) === 312
  })).toBe(true)
}

async function expectSuccessV3Presentation(page: Page, viewport: (typeof viewports)[number]) {
  const copy = page.locator('.status-copy')
  const note = page.locator('.status-note')
  const title = page.locator('.status-view h1')
  const icon = page.locator('.status-view .status-icon')
  const mobile = viewport.width <= 520 && viewport.height <= 900

  await expect(copy).toHaveCSS('text-align', 'center')
  await expect(copy).toHaveCSS('color', 'rgb(109, 128, 159)')
  await expect(copy).toHaveCSS('font-size', mobile ? '15.5px' : '17px')
  await expect(copy).toHaveCSS('margin-top', mobile ? '13px' : '18px')
  await expect(note).toHaveCSS('color', 'rgb(113, 132, 160)')
  await expect(note).toHaveCSS('font-size', mobile ? '13.5px' : '15px')
  await expect(note).toHaveCSS('margin-top', mobile ? '16px' : '22px')
  await expect(note).toHaveCSS('margin-bottom', mobile ? '27px' : '42px')
  await expect(title).toHaveCSS('font-size', mobile ? '37px' : '43px')
  await expect(icon).toHaveCSS('width', mobile ? '91px' : '118px')
  expect(await copy.evaluate((element) => Math.round(element.getBoundingClientRect().x + element.getBoundingClientRect().width / 2))).toBe(Math.round(viewport.width * (mobile ? .5 : .75)))
}

for (const viewport of viewports) {
  test(`FE-002 ${viewport.name}: solicitud, alertas y confirmación v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/password-recovery')
    await expect(page.getByRole('heading', { name: '¿Olvidaste tu contraseña?' })).toBeVisible()
    await expect(page.locator('.recovery-form-panel h1')).toHaveCSS('text-align', 'center')
    await expectBrandPanelGeometry(page, viewport)
    await stableShot(page, `${viewport.name}-request`)

    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
    await expect(page.getByRole('alert')).toContainText('correo electrónico válido')
    await stableShot(page, `${viewport.name}-request-validation`)

    await page.goto('/password-recovery')
    await mockResponse(page, 500)
    await page.locator('#recovery-email').fill('person@example.com')
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await stableShot(page, `${viewport.name}-request-error`)
  })

  test(`FE-002 ${viewport.name}: cooldown, indisponibilidad, carga y confirmación v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/password-recovery')
    await mockResponse(page, 429, { 'Retry-After': '30' })
    await page.locator('#recovery-email').fill('person@example.com')
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
    await expect(page.locator('.recovery-alert[role="status"]')).toContainText(/espera \d+ segundos/)
    await stableShot(page, `${viewport.name}-request-cooldown`)
  })

  test(`FE-002 ${viewport.name}: indisponibilidad, carga y confirmación v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/password-recovery')
    await mockResponse(page, 503)
    await page.locator('#recovery-email').fill('person@example.com')
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
    await expect(page.getByRole('alert')).toContainText('no está disponible temporalmente')
    await stableShot(page, `${viewport.name}-service-unavailable`)
  })

  test(`FE-002 ${viewport.name}: carga y confirmación v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/password-recovery')
    const releasePendingRequest = await mockPendingResponse(page)
    try {
      await page.locator('#recovery-email').fill('person@example.com')
      await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
      await expect(page.getByRole('button', { name: 'Enviando solicitud...' })).toBeDisabled()
      await stableShot(page, `${viewport.name}-request-loading`)
    } finally {
      await releasePendingRequest()
    }

    await page.goto('/password-recovery/confirmation')
    await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible()
    await stableShot(page, `${viewport.name}-confirmation`)
  })

  test(`FE-002 ${viewport.name}: reset, resultado y tokens v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openReset(page)
    await stableShot(page, `${viewport.name}-reset`)
    await page.locator('#new-password').fill('correct-password')
    await page.locator('#confirm-password').fill('correct-password')
    await expect(page.getByText('Las contraseñas coinciden.')).toBeVisible()
    await stableShot(page, `${viewport.name}-reset-ready`)

    await page.goto(`/password-reset?token=${token}`)
    await page.getByRole('button', { name: 'Restablecer contraseña' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await stableShot(page, `${viewport.name}-reset-validation`)
  })

  test(`FE-002 ${viewport.name}: errores y carga de reset v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openReset(page)
    await mockResponse(page, 422)
    await submitReset(page)
    await expect(page.getByRole('alert')).toContainText('política')
    await stableShot(page, `${viewport.name}-reset-error`)

    await openReset(page)
    const releasePendingReset = await mockPendingResponse(page)
    try {
      await submitReset(page)
      await expect(page.getByRole('button', { name: 'Restableciendo…' })).toBeDisabled()
      await stableShot(page, `${viewport.name}-reset-loading`)
    } finally {
      await releasePendingReset()
    }
  })

  test(`FE-002 ${viewport.name}: éxito y tokens v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openReset(page)
    await mockResponse(page, 204)
    await submitReset(page)
    await expect(page.getByRole('heading', { name: 'Contraseña actualizada' })).toBeVisible()
    await expect(page.locator('.status-copy')).toHaveText('Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.')
    await expect(page.locator('.status-note')).toHaveText('Por seguridad, el enlace utilizado dejó de estar disponible.')
    await expectSuccessV3Presentation(page, viewport)
    await stableShot(page, `${viewport.name}-success`)
  })

  test(`FE-002 ${viewport.name}: tokens no válidos v3`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openReset(page)
    await mockResponse(page, 410)
    await submitReset(page)
    await expect(page.getByRole('dialog', { name: 'Enlace vencido o no válido' })).toBeVisible()
    await stableShot(page, `${viewport.name}-token-expired`)

    await openReset(page)
    await mockResponse(page, 400)
    await submitReset(page)
    await expect(page.getByRole('dialog', { name: 'Enlace no válido' })).toBeVisible()
    await stableShot(page, `${viewport.name}-token-invalid`)
    // El contrato no distingue token usado de inválido: la misma presentación pública evita filtraciones.
    await stableShot(page, `${viewport.name}-token-used`)
  })

  test(`FE-001 ${viewport.name}: shell compartido y formulario protegido`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
    await expectBrandPanelGeometry(page, viewport)
    await stableShot(page, `${viewport.name}-fe001-login`)
  })
}
