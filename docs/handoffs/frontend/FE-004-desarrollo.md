# FE-004 — Handoff de Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD+71a31cc / FE-004-95444c0a9a91`

## Remediación QA

Se corrigió únicamente la accesibilidad del diálogo de confirmación de bloqueo/reactivación. `StatusConfirmation` reutiliza `useFocusTrap`: al abrir, enfoca la primera acción, contiene `Tab`/`Shift+Tab`, cierra con `Escape` y devuelve el foco al botón «Más acciones» que lo abrió. No se modificaron CSS, layout, contratos ni reglas funcionales.

## Archivos

- `src/features/company-users/components/CompanyUsersPage.tsx`
- `src/features/company-users/CompanyUsersPageRoute.test.tsx`

## Verificación

- `npm test -- src/features/company-users/CompanyUsersPageRoute.test.tsx` — 4/4 pruebas, incluida la navegación por teclado y `Escape` del modal.
- `npm run typecheck` — correcto.
- `npx eslint src/features/company-users src/app/App.tsx` — correcto sobre este Candidate-ID.
- `npm run build` — correcto sobre este Candidate-ID.
- `git diff --check` — correcto.

## Criterios y riesgos

Quedan cubiertos el foco inicial, la trampa de foco, el cierre por teclado y la restauración de foco para bloquear y reactivar, sin afectar mutaciones ni permisos. Riesgo residual heredado: la cobertura focalizada aún no reproduce respuestas 403/409/422, vacío/error ni logout durante una mutación; corresponde a la revalidación QA.

## Reproducción

Como `COMPANY_ADMIN`: «Más acciones» → «Bloquear usuario» o «Reactivar usuario»; verificar foco en «Cancelar», ciclo con `Tab`, y cierre/retorno al disparador con `Escape`.
