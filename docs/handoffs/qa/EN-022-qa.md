# EN-022 — QA Backend

**Estado:** `PASS`
**Candidate-ID:** `HEAD+a189f4d EN022-5ec390c8640b`.

## Mapeo resumido

- Carrera settings/captura → consultas de captura y settings bloquean la misma fila tenant con `FOR UPDATE OF c`, dentro de sus transacciones → `JdbcCurrentCompanyQuery`/`JdbcCompanySettingsStore` → inspección y focal → PASS; la actualización posterior invalida el snapshot capturado.
- Matriz parcial o no positiva → `validatePart` rechaza forma incompleta y pares fuera de diagonal `<=0` → `CreateRouteServiceTest` → PASS.
- Fragmentación → bloques de cuatro si el resto sería uno; máximo diez nodos, 50 visitas/2,450 pares → `CreateRouteService`/prueba de 50 → PASS.
- Regresiones de vencimiento, tenant/roles y publicación → controles existentes → `PublishRouteServiceTest` → PASS.

## Evidencia

- `mvn -q "-Dtest=CreateRouteServiceTest,CompanySettingsServiceTest,PublishRouteServiceTest,RoutingConfigurationTest" test "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository"` — PASS.
- `git diff --check` — PASS.
- `mvn -q verify ...` — PASS (evidencia Development del candidato); `clean verify` sigue `NOT_EXECUTED` por el `target` retenido.

Hallazgos: ninguno. Riesgo residual: falta una prueba de integración concurrente que demuestre la espera sobre la fila de empresa; la inspección confirma el bloqueo común y la focal pasó. `clean verify` sigue condicionado por el `target` retenido.

## QA Frontend — PASS

- `COMPANY_ADMIN` configura jornada sin default con ETag; `SUPERVISOR` solo lee y `SELLER` no consulta settings.
- El borrador exige duración entera positiva por visita, envía visitas ordenadas sin `startLocation` y el `409` de publicación explica el bloqueo de jornada/snapshot sin atribuir concurrencia falsa.
- Cambio de sesión/tenant invalida settings, ETag y formulario previo.
- `npm test -- --run src/features/company-settings src/features/company-routes/api.test.ts src/features/company-routes/hooks/useRouteDraft.test.tsx src/features/company-routes/components/RouteDraftDialog.test.tsx src/features/company-routes/components/RoutePublishDialog.test.tsx src/features/company-routes/hooks/useRoutePublish.test.tsx` — PASS, 38 pruebas; `npm run typecheck` y `git diff --check` — PASS.
