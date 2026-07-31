# Handoff de Desarrollo — EN-016

## Estado

`READY_FOR_HANDOFF`

## Alcance

- Política aprobada para rastreo solo en jornada, con frecuencia 60 s, radio
  100 m, precisión máxima 50 m y antigüedad máxima 5 min.
- Rechazo de muestras inválidas sin persistencia, Redis, WebSocket ni geocerca;
  solo evento técnico sanitizado y estado degradado.
- Retención: PostgreSQL/PostGIS 90 días con purga física; Redis <=15 min; cola
  local cifrada hasta confirmación o resolución autorizada.
- Mínimo privilegio por tenant/rol/equipo/recurso; soporte excepcional futuro
  con justificación, temporalidad, autorización y auditoría.
- D6-D8: permiso/GPS/logout, eliminación manual aprobada por Legal y
  transparencia/auditoría sin coordenadas.
- Remediación de contratos tras `CHANGES_REQUIRED`: cola offline independiente,
  idempotencia/repetición/concurrencia, TrackPoint con recepción, WebSocket
  tipable, filtros por equipo e histórico FE-022 paginado con visitas.
- Remediación Mobile: RN-020 hace logout incondicional; `LocationResult` es una
  unión discriminada y todo `REJECTED` exige `errorCode`; el acuse garantiza
  cardinalidad y orden uno-a-uno por `clientEventId`, sin coordenadas.
- Remediación QA H-01: `LocationSample` admite estructuralmente precisión
  0..10000; >50 es rechazo de negocio por muestra y no invalida el lote. ADR,
  cola offline y matriz distinguen envelope transportable de ubicación aceptada.
- Remediación Seguridad SEC-EN016-001..006: D9-D12 opción A registradas;
  tolerancia futura/retención, cadencia/rate-limit multi-device, mocked/UNKNOWN,
  ciclo completo de copias, revocación WS inmediata e idempotencia de lote
  vinculada con validación estricta del acuse Mobile.
- Remediación final SEC-EN016-006: batch guard precede sample guard; replay
  exacto conserva el acuse/status original sin reproceso, conflicto de binding
  da 409 sin mutación y solo un lote lógico nuevo puede producir DUPLICATE por
  una muestra previamente aceptada.

## Rutas y diff

- `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`: decisión,
  operación, purga, rollback, dependencias y pendientes.
- `docs/architecture/adr/ADR-015-persistencia-local-sincronizacion-mobile.md`:
  referencia mínima a ADR-016, sin cambiar su decisión EN-015.
- `00_CONTRATO_FUNCIONAL.md` y `docs/functional/contrato-funcional.md`:
  RF-UBI-003/008, validación 15.1, sección 17 y decisiones 7/8/15.
- `docs/api/openapi.yaml` y `docs/events/websocket-contract.md`: contratos
  futuros con valores fijos y rechazo seguro.
- `docs/sync/location-offline-contract.md`: registro local, lote, acuse,
  resolución, limpieza segura y autoridad derivada de sesión.
- `docs/qa/EN-016-matriz-criterio-evidencia.md`: CA → decisión → prueba e
  INT-031.
- Historia EN-016, threat model y baseline actualizados.

El diff se limita a documentación, contratos futuros y evidencia EN-016; no
incluye implementación de tracking, endpoints, pantallas, migraciones ni
modificaciones de `docs/sync/mobile-sync-contract.md`.

## Criterios de aceptación

Los seis criterios de EN-016 están trazados a decisiones y evidencia propuesta
en `docs/qa/EN-016-matriz-criterio-evidencia.md`: jornada, parámetros de
calidad/frecuencia, retención/acceso, degradación de permiso-GPS-batería,
avisos/auditoría/eliminación y responsables.

## Decisiones y responsables

D1-D12 opción A fueron confirmadas el 2026-07-31 por Luis Siancas en Producto,
Legal/Privacidad y Seguridad. ADR-016 conserva el detalle y los compromisos
fuera de alcance; la validación independiente sigue siendo obligatoria.

## Comandos y evidencia

| Comando | Resultado |
|---|---|
| `git diff --check` | PASS |
| `rg -n 'Frecuencia configurable|cada 1 a 3 minutos|Retención configurable|logout cuando aplique' 00_CONTRATO_FUNCIONAL.md docs docs/api/openapi.yaml` | Sin coincidencias |
| `rg -n 'ADR-016|D1|D2|D3|D4|D5|D6|D7|D8|BE-028|BE-029|BE-032|BE-034|BE-054|FE-020|FE-022|MOB-003|MOB-026|MOB-030|INT-031' ...` | PASS; política y dependencias trazables |
| `rg -n 'batchId|clientEventId|IDEMPOTENCY_CONFLICT|receivedAt|resourceVersion|sequence|businessDate|journeyId' docs/api/openapi.yaml docs/events/websocket-contract.md docs/sync/location-offline-contract.md` | PASS; seis hallazgos contractuales trazables |
| `rg -n 'logout siempre|RejectedLocationResult|exactamente un resultado|errorCode' 00_CONTRATO_FUNCIONAL.md docs/functional/contrato-funcional.md docs/api/openapi.yaml` | PASS; remediación Mobile trazable |
| `Get-Command swagger-cli,redocly,openapi-generator-cli,ConvertFrom-Yaml` y búsqueda local de `yaml`/`js-yaml`/SnakeYAML | Sin herramienta YAML disponible; no se instalaron dependencias |
| `rg -n 'maximum: 10000|LOCATION_ACCURACY_EXCEEDED|no invalidar.*lote|no abortar.*lote' docs/api/openapi.yaml docs/sync/location-offline-contract.md docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md` | PASS; H-01 trazable |
| `rg -n 'LOCATION_TIMESTAMP_IN_FUTURE|LOCATION_FREQUENCY_EXCEEDED|LOCATION_MOCKED|LOCATION_INTEGRITY_UNKNOWN|LOCATION_BATCH_IDEMPOTENCY_CONFLICT|crypto-erasure|fail-closed' docs` | PASS; SEC-EN016-001..006 trazables |
| `rg -n 'guarda de lote.*precede|acuse original|sin reprocesar|lote lógico nuevo' docs/api/openapi.yaml docs/sync/location-offline-contract.md docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md` | PASS; precedencia SEC-EN016-006 inequívoca |

No hay código productivo, migraciones ni tests runtime en EN-016; por ello no
corresponde ejecutar Maven, Flutter ni E2E en esta fase documental.

## Riesgos

- INT-031 debe probar purga idempotente, filtros de vencimiento, réplicas,
  Redis, backup/restore y ausencia de reintroducción de ubicaciones vencidas.
- Las historias productivas deben demostrar aislamiento tenant/equipo, permisos,
  logout/revocación, offline, bloqueo seguro de cola y no emisión de coordenadas
  en telemetría degradada.
- La semántica está definida, pero el runtime de guarda idempotente, orden WS,
  snapshot por gap y paginación debe implementarse y probarse en sus historias.
- El umbral de `stale` no pertenece a EN-016 y queda pendiente del contrato de
  presencia BE-030, con revisión de FE-020/QA; el servidor conserva autoridad
  sobre el flag.

## Pendientes
- Retención de visitas/ventas: responsable Luis Siancas, cierre 2026-08-14.
- Política detallada de auditoría y contador adicional D6: responsable Luis
  Siancas, cierre 2026-08-21; distinguirá fallo técnico/acción deliberada, sin
  coordenadas ni sanciones automáticas.
- La aceptación de decisión no es aprobación legal ni de seguridad de las
  implementaciones futuras.

## Siguientes autorizados (Fase 2)

QA y Ciberseguridad independientes revisan este diff y la matriz. Después, los
responsables de BE-028/029/032/034/054, FE-020/022, MOB-003/026/030 e INT-031
implementan y evidencian los controles acordados.
