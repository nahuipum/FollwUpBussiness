# FE-014–FE-017 · Contexto de corrección visual de Rutas

Estado: Dev `READY_FOR_HANDOFF`; QA `PASS`; Security `PASS`; DoF `PASS`; Candidate-ID: `574be0e + 3c274a322bc0` (HEAD + digest del diff trackeado de Rutas; la prueba visual continúa sin seguimiento).

## Delta Development Frontend — contradicción de prioridad

El golden de FE-016 ilustra prioridad en todas las visitas, mientras que la instrucción vigente permite priorizar sólo un subconjunto. El contrato exige un entero `priority >= 1` por visita y el Backend ordena por prioridad descendente de forma estable; las prioridades iguales no se reordenan por distancia. Resolución: la UI ofrece «Sin prioridad especial», que se envía como `1`; Baja, Media y Alta se envían como `2`, `3` y `4`. La ayuda declara que los niveles explícitos se consideran antes que las visitas sin prioridad especial y que jornada, ventanas y traslados también influyen, sin prometer un orden por distancia.

`useRouteDraft` aplica ese `1` al abrir, seleccionar y serializar propuestas, incluidos `generateAutomatic` y `optimize`. Las validaciones de duración, jornada y ventanas no cambian. Evidencia: `useRouteDraft.test.tsx` (13 PASS, dos visitas explícitas `4/2` y una por defecto `1`), 503/factible visual (2 PASS), matriz FE-016 de cuatro viewports y ambos temas (8 PASS), `typecheck`, `build` y `git diff --check` PASS; lint sin errores y warning preexistente de Territorios.

## Alcance, contrato y decisiones vigentes

Contenido de Rutas y sus pruebas visuales, con variantes compartidas opt-in. Se conserva `CompanyWorkspaceLayout`, contrato API, empresa/sesión, DRAFT, idempotencia, versión, permisos y el fallback accesible.

El mapa dibuja solo geometría del proveedor y ubicaciones reales. Loading, fallo, falta de proveedor o cliente sin ubicación muestran lista/estado accesible; no se inventan coordenadas, recorrido ni estimaciones. El rail usa `DataTablePagination` compartido, variante `golden` compacta y sin selector de tamaño para que 390 px conserve controles navegables. Se retiró el paginador local y su CSS sin consumidores.

El error 503 de optimización se preserva tras crear el DRAFT: la recarga causada por `onSaved` ya no limpia el error por cambiar únicamente la referencia de `sellers`; la clave de alcance incluye sus campos que alteran la cartera.

## Matriz Dev resuelta

| Historia | Estados y evidencia fallable | Resultado |
| --- | --- | --- |
| FE-014 | ready, filtros equivalentes vendedor/estado, selector/calendario, rail, menús por estado, detalle editable/solo lectura, loading, stale, vacío, no-results, 403, error, dark y móvil | Los iconos de modo son 20×20 con trazo 1.8 y ambas CTA se anclan al borde inferior; el detalle usa fecha larga, resumen de 3 columnas, tarjetas contractuales sin estimaciones fabricadas, encabezado de mapa y cierre 44×44 con foco inicial verificable. |
| FE-015 | modo, base, clientes, validación, límite, orden/revisión, mapa loading/error/sin proveedor/sin ubicación, guardar/éxito/conflicto, advertencia publicada y móvil | Encabezado, secuencia y título fijo “Mapa de ubicaciones” alineados al golden; el subtítulo conserva la disponibilidad vial real. `Atrás` se conserva porque vuelve de paso y no descarta cambios. |
| FE-016 | stepper de 5 pasos, candidatos, restricciones, validación, generating, 503, 409, reintento, OPTIMAL, FEASIBLE, TIME_LIMIT, no asignadas, edición, estimaciones stale, guardar | Stepper con conectores reales y control geométrico; tarjetas compactas con ayudas pertinentes, reloj decorativo solo en ventanas y jornada sin reloj. El encabezado abre el selector de modo mediante una transición explícita sin optimizar ni publicar, y el pie conserva salida. Fixture sin foco residual. |
| FE-017 | revisión, validación 422/error normalizado, confirmación, ocupado, éxito, conflicto 409 y móvil | Fecha ISO real formateada para personas; checkbox y advertencia apilados con icono. No se añadieron estimaciones del golden ausentes en `RoutePoint`. |
| Regresión visual | 1440×900, 1280×720, 1024×768 y 390×844; claro y oscuro | Suite visual de Rutas 34/34 OK. Evidencia nueva en `docs/handoffs/frontend/FE-014-017-visual-evidence/2026-09-16T19-12-41-403Z/`. |

## Validación Dev

- `npm run test -- src/features/company-routes/components/RoutePlanningWorkflow.test.tsx src/features/company-routes/components/RouteProposalWorkflow.test.tsx src/features/company-routes/components/RoutePublishWorkflow.test.tsx --run`: 3 archivos, 17 pruebas OK.
- `npm run typecheck`, `npm run build` y `git diff --check`: OK.
- `npm run lint`: salida 0; único warning preexistente fuera de alcance en `company-territories/hooks/useTerritoryForm.test.tsx`.
- `npm run test -- src/features/company-routes/components/RouteDetailDialog.test.tsx src/shared/ui/ModalHeader.test.tsx --run`: 2 archivos, 5 pruebas OK.
- `npm run test:visual -- tests/visual/company-routes.visual.spec.ts`: 34/34 OK; comprueba trazos, foco, conectores/espaciado del stepper, fecha, tarjetas, avisos y mapa contra los mockups.
- `npm run test -- src/features/company-routes/components/RouteSequenceMap.test.tsx --run`: 10 pruebas OK; corrida final `npm run test:visual -- tests/visual/company-routes.visual.spec.ts`: 34/34 OK tras actualizar expectativas de copy y salida vigentes.
- Corrección final FE-016: `TimeField.test.tsx` y `RouteProposalWorkflow.test.tsx`, 7 pruebas OK; `npm run typecheck`, `npm run lint`, `npm run build` y `git diff --check` OK. Lint conserva un warning ajeno de Territorios y build el aviso de chunks grandes.

Revisión manual: capturas de propuesta `TIME_LIMIT` y conflicto de publicación móvil verificadas; no se detectaron recortes de mapa inferior, checkbox, pie o controles. Auditoría de CSS: sin `!important` en `company-routes.css`; los selectores de mapa, vista móvil, stepper y rail tienen consumidor; se eliminó `route-rail-pagination` residual.

## Riesgo residual y siguiente fase

El warning de lint de Territorios no pertenece al candidato. La geometría real depende de proveedor/ubicaciones del backend; las regiones visuales verifican estructura y estilos estables, y no se inventan llegadas ni duración de `RoutePoint`. El cambio no amplía contrato ni permisos.

## Delta QA

QA independiente `PASS` para `574be0e + 3c274a322bc0`: FE-016 permite priorizar sólo dos de tres visitas y serializa `4/2/1` en `optimize` y `generateAutomatic`; el selector se restablece a «Sin prioridad especial» (`1`). Duración, jornada y ventanas continúan obligatorias; el negativo 503 conserva DRAFT y restricciones. Pruebas focalizadas 18/18, visuales 9/9 (503 y 1440/1280/1024/390, claro/oscuro) y `git diff --check` OK. El diff no toca permisos/acceso, sesión/tenant/caché, WebSocket, mapa, paginación, modal ni drawer.
