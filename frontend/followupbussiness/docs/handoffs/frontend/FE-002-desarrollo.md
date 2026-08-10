# FE-002 — Desarrollo

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `1ffbd50 + FE-002-d5977bcf5fc6` (SHA-256 determinista de rutas FE-002 de código, pruebas, configuración y recursos, incluidos no rastreados).
- Referencia visual consultada: `../../docs/frontendMockups/FE-002-password-recovery-states-v3.html` (éxito y responsive).

Se corrigió exclusivamente el estado success en `src/features/auth/components/PasswordRecoveryScreen.tsx`: ahora renderiza como elementos separados los textos exactos de v3: `Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.` y `Por seguridad, el enlace utilizado dejó de estar disponible.`. `src/features/auth/styles/password-recovery.css` conserva tokens v3 desktop y añade los valores compactos v3 del bloque success para 390×844. Se preservan título, navegación al login, token efímero/sanitización y zonas FE-001 protegidas.

Pruebas actualizadas: `src/app/PasswordRecoveryScreen.test.tsx` verifica ambos textos; `tests/visual/password-recovery.visual.spec.ts` los verifica por separado en desktop/mobile, incluido color, tipografía, espaciado y posición, y hace robusta la aserción de cooldown frente al contador temporal.

Verificación (todas con exit 0):

- `npx vitest run src/app/PasswordRecoveryScreen.test.tsx --environment jsdom -t "shows an expired token state and clears the URL token after reset success"` — 1 PASS.
- `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-002 desktop: solicitud, alertas y confirmación v3'` — 1 PASS.
- `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-002 desktop: (reset, resultado y tokens|errores y carga de reset) v3'` — 2 PASS; `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-002 desktop: (éxito y tokens|tokens no válidos) v3'` — 2 PASS.
- `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-002 mobile: solicitud, alertas y confirmación v3'` — 1 PASS.
- `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-002 mobile: (reset, resultado y tokens|errores y carga de reset) v3'` — 2 PASS; `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-002 mobile: (éxito y tokens|tokens no válidos) v3'` — 2 PASS.
- `npx playwright test --reporter=line --workers=1 --timeout=15000 --grep 'FE-001 (desktop|mobile): shell compartido y formulario protegido'` — 2 PASS.
- `npx playwright test --reporter=line --workers=1 --timeout=15000` — 18 PASS; `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` — PASS.

Criterios cerrados: copy y nota v3 separados; tipografía/color/espaciado/alineación/posición success desktop 1440×900 y móvil 390×844; regresión FE-001 verde. Contratos, permisos, sesión/empresa, API y datos sensibles: sin cambios. Riesgo residual: ninguno conocido. Reproducción: abrir `/password-reset?token=<43 caracteres>`, responder `204` al reset y comprobar ambos textos antes de `Ir al inicio de sesión`.
