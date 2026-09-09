# EN-022 — Desarrollo Frontend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD+a189f4d EN022-31b10589bfef`

## Alcance

- `COMPANY_ADMIN` configura jornada de planificación local inicio/fin, sin valor por defecto y con `If-Match`; supervisor la ve sin editar y seller recibe prohibido sin consulta.
- La creación manual exige duración entera positiva, en segundos, para cada visita y envía `visits[{customerId,serviceDurationSeconds}]`, sin `startLocation`: el primer cliente inicia y el último finaliza la ruta. No se presentan ni solicitan ventanas.
- La publicación con `409` indica bloqueo por jornada/snapshot válido sin afirmar una concurrencia inexistente. Estado de carga, error, refresco, ETag y cambio de sesión/empresa se preservan.

## Archivos

- `src/features/company-settings/{types,api,CompanySettingsPage}.ts*` y estilos/pruebas.
- `src/features/company-routes/{types,api,CompanyRoutesPage}.ts*`, `hooks/useRouteDraft.ts`, diálogos de borrador/publicación, estilos y pruebas.

## Evidencia

- `npm run typecheck` — PASS.
- `npm test -- --run src/features/company-settings src/features/company-routes/api.test.ts src/features/company-routes/hooks/useRouteDraft.test.tsx src/features/company-routes/components/RouteDraftDialog.test.tsx src/features/company-routes/components/RoutePublishDialog.test.tsx src/features/company-routes/hooks/useRoutePublish.test.tsx` — PASS (38).
- `npm run lint` — PASS con 2 advertencias preexistentes ajenas; `npm run build` — PASS.
- `git diff --check` — PASS.

## Criterios y reproducción

Como `COMPANY_ADMIN`, configure `08:00–18:00`, cree borrador seleccionando clientes y una duración positiva para cada uno; verificar payload de visitas. Sin duración, creación bloqueada. Como supervisor, la jornada es sólo lectura; como seller, Settings es prohibido. Si el backend responde `409` al publicar sin jornada/snapshot válido, se muestra la acción para recargar sin mensaje de concurrencia.

## Riesgo

Remediación final: el contrato ya elimina `startLocation`; la prueba de API verifica que el payload manual conserva el orden de visitas y no incluye ese campo.
