# QA Backend independiente — EN-016

## Estado

`PASS`

## Historia y alcance

Revisión independiente documental de `EN-016 — Definir privacidad, retención y rastreo`, criterios 1–6.

Revalidación independiente del worktree sin commit sobre `HEAD 3fdf672`, tras H-01, D9–D12 / SEC-EN016-001..006 y la precisión final de precedencia SEC-006. Hay nueve rutas modificadas y cuatro rutas EN-016 sin seguimiento, incluido ADR-016 y los handoffs de Desarrollo y Seguridad. No hay CI ni prueba runtime atribuible a un commit candidato. EN-016 declara que no implementa código, migraciones ni endpoints. No se emitió aprobación Legal ni de Seguridad.

Rutas revisadas: historia EN-016; handoffs de Desarrollo y Seguridad; ADR-015/016; `00_CONTRATO_FUNCIONAL.md` y su copia funcional; OpenAPI; contrato WebSocket; `location-offline/v1`; matriz EN-016; threat model y baseline. No se revisó ni ejecutó código productivo por no formar parte del diff.

## Matriz criterio → implementación → prueba futura → evidencia

| Criterio | Implementación/contrato revisado | Prueba futura observable | Evidencia / resultado |
|---|---|---|---|
| CA1 jornada exclusiva | ADR-016 D2/D6; RN-020; RF-UBI-008 | Aplicación+Mobile: inicio/cierre vendedor, cierre administrativo, logout y revocación detienen captura, servicio, Redis y publicación | Documentación coherente. `NOT_EXECUTED` (sin runtime). |
| CA2 60 s, 50 m, 5 min e inválidas | ADR-016 D1-D3; `LocationSample` admite rango estructural 0..10000; `LocationResult` y `location-offline/v1` separan regla >50 | Contrato BE-029: lote con válida + `accuracyMeters=50.01` devuelve dos resultados ordenados, segundo `REJECTED/LOCATION_ACCURACY_EXCEEDED`; repetir/concurrir no muta DB/Redis/WS/geocerca | PASS documental de H-01. `NOT_EXECUTED` (sin runtime). |
| CA3 retención y acceso | ADR-016 D4-D5; REST/WS `tracking/v1`; track paginado | Integración INT-031: purga física 90 días idempotente en tablas/proyecciones/Redis/restore; autorización negativa cross-tenant, equipo, rol y recurso; histórico máximo 200 y puntos de visita paginados | Trazado documental; `NOT_EXECUTED`. Persisten pendientes de implementación. |
| CA4 permiso, GPS, batería | ADR-016 D3/D6; contrato funcional 17.2 | Mobile: permiso/GPS/servicio/batería degradados, acción recuperable, sin coordenadas en telemetría y sin visita geolocalizada | Trazado documental; `NOT_EXECUTED`. |
| CA5 aviso, auditoría, eliminación | ADR-016 D4/D7/D8; baseline/threat model | Mobile+INT-031: indicador/aviso; auditoría saneada; eliminación manual autorizada; purga física y cola cifrada hasta acuse o resolución | Trazado documental; `NOT_EXECUTED`. Política detallada de auditoría y retención visitas/ventas están fuera de alcance y no se califican como fallo. |
| CA6 responsables | Historia y ADR-016 registran D1-D12 y responsable Luis Siancas; handoff conserva la revisión independiente futura | DoF: confirmar evidencias de Producto, Legal/Privacidad y Seguridad en las historias implementadoras | Decisión registrada; no equivale a aprobación independiente de implementación. |
| D9 / SEC-001 reloj y retención | ADR-016 D9: borde futuro <=2 min, rechazo estable, efectos cero y vencimiento `min(capturedAt,receivedAt)+90 días` | BE-029/INT-031: borde +2 min, +2 min+ε, futuro lejano, replay y concurrencia; sin DB/Redis/WS/geocerca/visita para rechazo | PASS documental; `NOT_EXECUTED`. |
| D10 / SEC-003 cadencia y abuso | ADR-016 D10; OpenAPI 429/`Retry-After`; offline: ventana UTC 60 por tenant+owner+jornada y rate-limit multi-device | Concurrencia y multi-lote/dispositivo: una aceptada por ventana, extras `LOCATION_FREQUENCY_EXCEEDED`; ventanas offline distintas pasan; presupuesto devuelve 429 sin coordenadas | PASS documental; `NOT_EXECUTED`. |
| D11 / SEC-004 integridad | ADR-016 D11; OpenAPI tracking/proximidad/check-in; WS `integrityStatus` | `mocked=true` no publica ni habilita geocerca/visita; ausencia queda `UNKNOWN`, puede tracking pero no visita; sin sanción automática | PASS documental; `NOT_EXECUTED`. |
| D12 / SEC-005 borrado | ADR-016 D12; ADR-015 y offline: crypto-erasure, backups móviles excluidos, restore en cuarentena, limpieza local | INT-031/Mobile: backup/restore/purga, clave segmentada destruida, fila/páginas limpiadas, logout/cambio de ámbito sin recuperación | PASS documental; `NOT_EXECUTED`. |
| SEC-002 WS revocado | `tracking/v1`: reautorización antes de publicación/snapshot, cierre fail-closed y cancelación de carrera | Logout/revocación/expiración/cambio rol-equipo-tenant-recurso/cierre administrativo durante publicación y snapshot; sin reconexión ni snapshot revocado | PASS documental; `NOT_EXECUTED`. |
| SEC-006 lote/acuse | Guarda de lote antes de muestra; replay exacto preserva acuse/status; conflicto 409 sin mutación; solo lote nuevo llega a muestra; Mobile valida acuse | Mismo binding conserva `ACCEPTED` original; cambio contexto/device/conjunto/contenido/orden da conflicto; lote nuevo con `clientEventId` aceptado da `DUPLICATE`; acuse extra/ausente/duplicado/reordenado no limpia cola | PASS documental; `NOT_EXECUTED`. |

## Decisiones y responsables

- D1–D12 opción A están registradas como aceptadas el 2026-07-31, responsable declarado: Luis Siancas (Producto, Legal/Privacidad y Seguridad).
- La decisión asigna implementación a BE-028/029/032/034/054, FE-020/022, MOB-003/026/030 e INT-031. Este QA no aprueba esas implementaciones futuras.
- Pendientes legítimos, `NOT_APPLICABLE` al cierre documental: retención de visitas/ventas (2026-08-14) y detalle/contador de auditoría D6 (2026-08-21).

## Comandos y evidencia

| Comando/inspección | Resultado |
|---|---|
| `git status --short`; `git log --oneline -12`; `git diff --name-only` | Objetivo delimitado como worktree sobre `3fdf672`; no hay SHA candidato ni CI verificable del mismo commit. |
| `git diff --check` | PASS; sin errores de whitespace. |
| `rg -n -C 2 "LocationSample|accuracyMeters|LocationBatchResponse|LocationResult" docs/api/openapi.yaml` | `LocationSample`, proximidad y check-in usan 0..10000 estructural; `TrackPoint` conserva máximo 50 como salida aceptada. El acuse sigue siendo obligatorio por muestra. |
| Revisión de ADR-016 D1–D8, RN-020, RF-UBI-003/008, 15.1, 17.2–17.4, ADR-015, WS y `location-offline/v1` | Trazabilidad documental de jornada, calidad, aislamiento, cola, purga, auditoría y degradación. |
| Revisión dirigida D9–D12, OpenAPI `LocationBatchConflict`/`LocationRateLimited`, WS y matriz INT-031 | Consistencia documental de límite futuro, ventana UTC/rate-limit, mocked/UNKNOWN, lifecycle de copia, revocación WS y fingerprint/acuse. |
| Revisión dirigida SEC-006 en OpenAPI, ADR-016, `location-offline/v1`, matriz y handoff | Precedencia inequívoca batch→sample; replay exacto, 409 fail-closed, nuevo lote→`DUPLICATE` y validación Mobile del acuse. |
| Maven/JUnit/arquitectura/migración/E2E | `NOT_EXECUTED`: no hay código, prueba, migración ni CI de EN-016 que aporte evidencia runtime. |

## Hallazgos y riesgos

No hay hallazgos QA abiertos. H-01 queda resuelto: `LocationSample`, `ProximityValidationRequest` y `VisitCheckInRequest` aceptan el envelope estructural 0..10000. La regla de negocio `>50 m` se expresa respectivamente como `REJECTED/LOCATION_ACCURACY_EXCEEDED` por muestra, `eligible=false/LOW_ACCURACY` sin geocerca, y `422` sin iniciar visita ni geocerca. ADR-016, `location-offline/v1`, matriz y handoff conservan la misma separación; `TrackPoint` permanece limitado a <=50 por representar solo aceptadas.

Los hallazgos de diseño SEC-EN016-001..006 del handoff de Seguridad previo quedan cubiertos documentalmente por D9–D12: límite futuro/retención, ventana y presupuesto, `mocked`/`UNKNOWN`, crypto-erasure/restore, revocación WS y binding de lote/acuse. SEC-006 ahora fija además la precedencia batch→sample: replay exacto no reprocesa ni transforma `ACCEPTED` en `DUPLICATE`; el conflicto no muta; únicamente un lote lógico nuevo llega a la guarda por muestra. Esta conclusión QA no sustituye el retest independiente de Ciberseguridad, cuyo handoff vigente aún muestra `BLOCKED` anterior a la remediación.

Reproducción futura SEC-006: (1) enviar lote A y repetir A con binding/fingerprint idéntico: acuse original con mismos statuses; (2) reutilizar clave o batchId con device, contexto, conjunto, contenido u orden distinto: 409 sin procesar ninguna muestra; (3) enviar lote B con binding nuevo y `clientEventId` de A: resultado `DUPLICATE` de la guarda por muestra; (4) Mobile recibe acuse con ID extra, ausente, duplicado o reordenado: no limpia y entra en `resolution_required`.

Reproducción futura de calidad: enviar un lote estructuralmente válido de dos muestras, precisión 20 y 50.01. Debe recibir HTTP 200, dos resultados en orden, con `ACCEPTED` o resultado normal para la primera y `REJECTED/LOCATION_ACCURACY_EXCEEDED` para la segunda, sin historial/cache/Redis/WebSocket/geocerca para esta última. Proximidad con 50.01 devuelve `eligible=false/LOW_ACCURACY`; check-in con 50.01 devuelve 422 y no inicia la visita.

Riesgos residuales (no ejecutados): controles de tenant/equipo/rol/recurso, límite futuro, ventana/rate-limit multi-device, integridad declarada, idempotencia concurrente por `clientEventId` y lote, revocación WS, limpieza de cola por cambio de usuario/tenant, purga/restore/crypto-erasure y ausencia de coordenadas en auditoría/telemetría requieren evidencia de las historias ejecutoras. Redis y WS deben seguir siendo estado efímero y no reintroducir ubicaciones vencidas.

## Pendientes y siguiente autorizado

1. Ciberseguridad reevalúa de forma independiente D9–D12/SEC-001..006 sobre este mismo candidato; DoF recibe ambas evidencias después.
2. Las pruebas dirigidas indicadas en la matriz quedan autorizadas únicamente al implementar BE-028/029/030/032/033/034/054, Mobile y INT-031.
