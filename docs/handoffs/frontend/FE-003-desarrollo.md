# FE-003 — Desarrollo

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `8822b32 + 2a0a3c8d1c4c`

## Remediación de seguridad

`src/features/auth/auth.ts` invalida el refresh en vuelo mediante una generación de sesión al limpiar sesión, logout o nuevo login. Una respuesta solo se aplica si conserva la generación y la instancia de sesión capturadas; si fue invalidada devuelve `superseded`, sin restaurar access, CSRF, identidad, roles ni empresa anteriores. El refresh nuevo de la generación vigente sigue siendo único en vuelo. `useSessionRoute` ignora ese resultado para no redirigir una sesión nueva.

`src/features/auth/auth.test.ts` incorpora la regresión: `SELLER/tenant-a` inicia refresh, cierra sesión, inicia como `COMPANY_ADMIN/tenant-b` y recibe tarde el refresh anterior. La prueba verifica `superseded`, acceso solo de tenant-b y la identidad/empresa nuevas.

## Contrato, criterios y evidencia

No cambia contrato: refresh WEB usa cookie, CSRF en memoria y headers WEB; logout limpia antes de red. Se cubren renovación, expiración, limpieza y no reutilización de tenant ante la carrera indicada por Seguridad.

- `npm test -- --run src/features/auth/auth.test.ts src/app/App.test.tsx src/lib/api.test.ts` — 24 pruebas correctas.
- `npm run typecheck` y `git diff --check` — correctos.

## Riesgo y reproducción

No se cancelan físicamente solicitudes Fetch; su resultado obsoleto se descarta localmente. Reproducción: diferir `/auth/refresh`, ejecutar logout y login de otro tenant, resolver la respuesta diferida y confirmar que no cambia la sesión nueva.
