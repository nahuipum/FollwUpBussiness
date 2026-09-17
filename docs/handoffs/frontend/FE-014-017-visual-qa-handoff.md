# PASS — QA independiente FE-014–FE-017 visual

**Candidate-ID:** `574be0e + 3c274a322bc0`.

| Criterio | Implementación → prueba → evidencia | Resultado |
| --- | --- | --- |
| Prioridad parcial FE-016 | `useRouteDraft` inicia y normaliza la visita sin prioridad como `1`; `RouteProposalControls` expone «Sin prioridad especial» (`1`), Baja (`2`), Media (`3`) y Alta (`4`). La prueba de hook envía `4/2/1` en `optimize`; la misma serialización se usa en `generateAutomatic`. | PASS |
| Restricciones y reset | Duración, jornada y extremos de ventana bloquean la solicitud inválida. El test visual abre el selector, elige Alta y lo restablece a «Sin prioridad especial»; el request queda en `priority: 1`. No se promete orden por distancia. | PASS |
| Fallo y estados | El negativo 503 conserva formulario, DRAFT, jornada y restricciones. `RouteProposalWorkflow` conserva etiquetas, `aria-label`, estado y campos accesibles. | PASS |
| Visual y regresión | La matriz cubre 1440/1280/1024/390 en claro/oscuro, selectores abiertos durante la carga de restricciones y geometría móvil. El diff sólo afecta `useRouteDraft` y controles de propuesta: sin cambio en permisos/acceso directo, sesión/tenant/caché, WebSocket, mapa, paginación, modal o drawer. | PASS |

Comandos: `npm run test -- src/features/company-routes/hooks/useRouteDraft.test.tsx src/features/company-routes/components/RouteProposalWorkflow.test.tsx --run` (18/18); `npm run test:visual -- tests/visual/company-routes.visual.spec.ts --grep "FE-016 muestra el 503 del optimizador y conserva el DRAFT|Rutas golden (1440x900|1280x720|1024x768|390x844) tema (claro|oscuro)" --workers=1 --reporter=line` (9/9); `git diff --check 574be0e -- [archivos afectados]` (OK).

Sin hallazgos abiertos. Riesgo residual: el proveedor y las ubicaciones reales determinan la geometría; no se inventan rutas, coordenadas ni estimaciones.
