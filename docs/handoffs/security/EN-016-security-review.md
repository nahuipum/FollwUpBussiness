# Retest independiente de Ciberseguridad — EN-016

## Estado

`PASS`

D9–D12, la revocación WebSocket y la precisión final de precedencia
lote→muestra cierran documentalmente los dos High y cuatro Medium del gate
original. No quedan hallazgos Critical, High, Medium o Low abiertos en el
alcance EN-016. Este PASS aprueba el diseño documental del snapshot; no acredita
controles runtime de las historias implementadoras.

Revisión de solo lectura sobre `HEAD
3fdf6728f3e2c5734610bb866bab7aa684f15dd8` más worktree sin commit candidato.
El snapshot de las 14 fuentes EN-016 revisadas tiene digest lógico SHA-256
`c5accd84be2a85df1389fa882ea4ca362aaf360802bb371d63b4c3b3878c30d0`.

## Historia y alcance

Historia: `EN-016 — Definir privacidad, retención y rastreo`, criterios 1–6.
El triage sigue siendo aplicable por geolocalización personal, autorización por
tenant/equipo/recurso, almacenamiento local, REST, WebSocket, Redis, retención,
backups, auditoría e idempotencia.

El retest se limitó a:

- aprobación humana D9–D12 del 2026-07-31;
- SEC-EN016-001: reloj futuro y vencimiento;
- SEC-EN016-002: reautorización/revocación WS y carreras;
- SEC-EN016-003: cadencia, flood, offline y múltiples dispositivos;
- SEC-EN016-004: `mocked` e integridad `UNKNOWN`;
- SEC-EN016-005: backups, crypto-erasure, restore y remanencia local;
- SEC-EN016-006: binding de lote, conflictos y validación del acuse;
- QA `PASS` actualizado del mismo worktree.

No hay código, migraciones, dependencias, infraestructura ni runtime EN-016. No
se ejecutaron Maven, Flutter, E2E, DAST ni escaneos generales.

## Rutas revisadas

- Historia/decisión: `docs/stories/enablers/EN-016-definir-privacidad-retencion-y-rastreo.md`
  y `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`.
- Contratos: `docs/api/openapi.yaml`, `docs/events/websocket-contract.md`,
  `docs/sync/location-offline-contract.md`, `00_CONTRATO_FUNCIONAL.md` y
  `docs/functional/contrato-funcional.md`.
- Cifrado/local: `docs/architecture/adr/ADR-015-persistencia-local-sincronizacion-mobile.md`.
- Riesgo/evidencia: `docs/security/security-baseline.md`,
  `docs/security/threat-model.md`, `docs/qa/EN-016-matriz-criterio-evidencia.md`,
  `docs/handoffs/governance/EN-016-development-handoff.md` y
  `docs/handoffs/qa/EN-016-qa.md`.
- Consumidor histórico afectado:
  `docs/stories/frontend/FE-022-historial-de-recorrido.md`.

## Criterios y controles

| Criterio/control | Resultado documental | Runtime |
|---|---|---|
| CA1: rastreo solo en jornada; cierre vendedor/administrativo, logout y revocación | PASS | NOT_EXECUTED |
| CA2: 60 s, precisión, antigüedad, futuro e inválidas | PASS; D9/D10 cierran ventana y efectos cero | NOT_EXECUTED |
| CA3: retención y acceso tenant/rol/equipo/recurso | PASS; D12 y WS cierran lifecycle/revocación | NOT_EXECUTED |
| CA4: permisos, GPS y batería | PASS | NOT_EXECUTED |
| CA5: aviso, auditoría, soporte y eliminación aplicable | PASS dentro de EN-016; pendientes declarados permanecen fuera de alcance | NOT_EXECUTED |
| CA6: responsables | PASS; D1–D12 aprobadas y responsables registrados | N/A |
| Idempotencia por muestra | PASS | NOT_EXECUTED |
| Idempotencia de lote y acuse | PASS; guarda de lote precede muestra y define replay exacto, conflicto y lote nuevo | NOT_EXECUTED |
| Logs, métricas, Redis y WS sin coordenadas inválidas | PASS | NOT_EXECUTED |

## Decisiones y responsables

- La historia registra D1–D12 opción A como aceptadas el **2026-07-31** por
  **Luis Siancas** en Producto, Legal/Privacidad y Seguridad. ADR-016 conserva
  la misma fecha y responsable; el handoff de Desarrollo y QA confirman el
  alcance D1–D12. Esta aceptación humana no sustituye el gate independiente.
- D9: máximo +2 min de reloj futuro y vencimiento
  `min(capturedAt, receivedAt)+90 días`.
- D10: una aceptación por ventana UTC de 60 s y control de abuso agregado entre
  dispositivos por tenant+usuario+jornada.
- D11: `mocked=true` rechazado; ausencia `UNKNOWN`, admitida en tracking pero no
  para habilitar visita; sin sanción automática.
- D12: 90 días abarcan copias/remanencia, claves segmentadas, crypto-erasure,
  exclusión de backup móvil, restore en cuarentena y limpieza local.
- SEC-EN016-001..006 están cerrados documentalmente; sus responsables de
  implementación futura permanecen en BE-029/MOB-009/QA y las historias
  trazadas por ADR-016.
- Retención de visitas/ventas y detalle de auditoría D6 mantienen responsables y
  fechas del ADR (2026-08-14 y 2026-08-21); no bloquean este retest documental.

## Modelo de amenazas y abuso dirigido

Activos: ubicación/recorrido, integridad de geocerca/visita, sesión y membresía
de equipo, cache Redis/WS, cola local y sus claves, backups y acuses que autorizan
la limpieza. Actores: vendedor o cliente Mobile manipulado, supervisor con
acceso revocado, operador de soporte/backup y emisor concurrente multi-device.

Límites de confianza: Mobile/SO y reloj cliente → REST; identidad/equipo →
autorizador REST/WS; PostgreSQL → Redis/WS; almacenamiento local → backup del SO;
base productiva → backup/restore; respuesta servidor → limpieza de cola Mobile.

| Abuso repetido | Evidencia del control | Resultado |
|---|---|---|
| `capturedAt` +2 min, +2 min+ε o futuro lejano | D9; rechazo `LOCATION_TIMESTAMP_IN_FUTURE`; vencimiento anclado al mínimo con `receivedAt`; matriz exige borde/replay/carrera | MITIGADO documental; SEC-001 CLOSED |
| Supervisor mantiene socket tras logout, expiración, cambio de rol/equipo/tenant/recurso o cierre | WS revalida antes de cada publish/snapshot, atiende señales, cancela mensajes en carrera y prohíbe reconexión/snapshot | MITIGADO documental; SEC-002 CLOSED |
| Lotes concurrentes/offline/multi-device saturan tracking | D10 acepta una por ventana UTC; extras sin efectos; 429+`Retry-After`; presupuesto agregado y telemetría saneada | MITIGADO documental; SEC-003 CLOSED |
| Cliente usa `mocked=true` o omite señal | `true` se rechaza; ausencia produce `UNKNOWN`, no habilita geocerca/visita; `false` se declara no infalible y no sanciona automáticamente | MITIGADO documental; SEC-004 CLOSED |
| Backup/local conserva coordenadas vencidas | D12 cubre claves por ámbito/periodo, crypto-erasure, exclusión backup SO, restore aislado y compactación/destrucción de clave | MITIGADO documental; SEC-005 CLOSED |
| Reuso de clave/lote con otro contexto/device/conjunto/orden | Fingerprint de binding; 409 sin procesar; acuse inconsistente no limpia | MITIGADO documental |
| Replay exacto del mismo binding después de `ACCEPTED` | Batch guard primero: conserva acuse/status original sin reproceso; solo un lote lógico nuevo llega a muestra y puede devolver `DUPLICATE` | MITIGADO documental; SEC-006 CLOSED |
| Acceso cross-tenant/equipo/recurso o soporte informal | Tenant/owner derivados, autorización por recurso y soporte default-deny temporal/auditado | MITIGADO documental; NOT_EXECUTED runtime |

## Hallazgos y estado de remediación

### SEC-EN016-001 — `capturedAt` futuro evade validación y retención

- Severidad original: **High**. Estado: `CLOSED_DOCUMENTALLY`.
- Evidencia: ADR-016 D9 líneas 97–104 y operación líneas 167–172; OpenAPI
  `LocationSample.capturedAt` y `LOCATION_TIMESTAMP_IN_FUTURE`; matriz casos 10.
- Retest de abuso: +2 min es borde permitido; >2 min/futuro lejano queda
  `REJECTED` sin historial, Redis, WS, geocerca o visita. El vencimiento usa
  `min(capturedAt,receivedAt)+90 días`, por lo que el cliente no lo extiende.
- Runtime: `NOT_EXECUTED`; BE-029/BE-034/INT-031 deben aportar evidencia.

### SEC-EN016-002 — WebSocket conserva autorización obsoleta

- Severidad original: **High**. Estado: `CLOSED_DOCUMENTALLY`.
- Evidencia: `websocket-contract.md`, reglas de reautorización antes de cada
  publicación/snapshot, cierre fail-closed, cancelación de carrera, reasonCodes
  saneados, prohibición de reconexión y limpieza FE; matriz caso 14.
- Retest de abuso: logout, expiración/revocación, cambios de rol/equipo/tenant/
  recurso, suspensión y cierre administrativo están enumerados; no se autoriza
  snapshot ni mensaje aún no entregado tras perder acceso.
- Runtime: `NOT_EXECUTED`; BE-030/identityaccess/FE-020 deben probar carreras.

### SEC-EN016-003 — Cadencia de 60 s no se aplica como control servidor

- Severidad original: **Medium**. Estado: `CLOSED_DOCUMENTALLY`.
- Evidencia: ADR-016 D10; OpenAPI 429 `LocationRateLimited`; offline precedencia
  7 y presupuesto agregado; matriz caso 11.
- Retest de abuso: primera muestra válida gana atómicamente por ventana UTC de
  60 s y tenant+owner+jornada; las demás quedan
  `LOCATION_FREQUENCY_EXCEEDED`; ventanas offline distintas siguen válidas y el
  presupuesto agrega dispositivos.
- Riesgo residual: el valor operativo del presupuesto/rate-limit no está
  cuantificado en EN-016. Debe fijarse y probarse en BE-029/BE-054 sin relajar la
  regla por ventana; no reabre el abuso original porque solo una muestra puede
  producir efectos por ventana.
- Runtime: `NOT_EXECUTED`.

### SEC-EN016-004 — `mocked` y ubicación falsificada no tienen política

- Severidad original: **Medium**. Estado: `CLOSED_DOCUMENTALLY`.
- Evidencia: ADR-016 D11; OpenAPI `LocationIntegrityStatus`, tracking,
  proximidad/check-in y WS `integrityStatus`; offline campo/precedencia 8;
  matriz caso 12.
- Retest de abuso: `mocked=true` no entra a tracking/geocerca; ausencia queda
  `UNKNOWN`, puede formar historial marcado pero no habilita visita;
  `mocked=false` no se presenta como prueba antifraude. No hay sanción
  automática.
- Riesgo residual aceptado por la decisión: un cliente modificado aún puede
  mentir con `mocked=false`; señales futuras requieren nueva revisión.
- Runtime: `NOT_EXECUTED`.

### SEC-EN016-005 — Borrado no cubre backups ni remanencia local

- Severidad original: **Medium**. Estado: `CLOSED_DOCUMENTALLY`.
- Evidencia: ADR-016 D12 y operación; contrato offline, registro local y
  limpieza; baseline/threat model; matriz caso 13.
- Retest de abuso: la copia móvil queda excluida; las claves de backup se
  segmentan por ámbito/periodo y se destruyen al vencer; restore permanece en
  cuarentena hasta purga; tras acuse/resolución se eliminan fila/páginas y la
  clave de ámbito cuando corresponde.
- Runtime: `NOT_EXECUTED`; Mobile/INT-031/Infraestructura deben demostrar
  irrecuperabilidad y restore seguro.

### SEC-EN016-006 — Precedencia contradictoria en replay exacto de lote

- Severidad original: **Medium**. Estado: `CLOSED_DOCUMENTALLY`.
- Evidencia: ADR-016 líneas 160–166; descripción OpenAPI del endpoint en línea
  1468; `location-offline-contract.md:92-120`; matriz casos 5 y 15; QA `PASS`
  actualizado.
- Retest de abuso:
  1. Lote A repetido con binding/fingerprint idéntico se resuelve primero por la
     guarda de lote y devuelve el acuse original, incluidos sus estados, sin
     reprocesar ni convertir `ACCEPTED` a `DUPLICATE`.
  2. Reuso de clave/batch con contexto, dispositivo, conjunto, contenido u orden
     distinto devuelve `409 LOCATION_BATCH_IDEMPOTENCY_CONFLICT` sin mutación.
  3. Solo un lote lógico nuevo alcanza la guarda por muestra; allí el
     `clientEventId` ya aceptado devuelve `DUPLICATE`.
  4. Acuse con ID extra, ausente, duplicado o reordenado no limpia la cola y
     entra en `resolution_required`.
- Resultado: precedencia única y acuse determinista; el abuso original queda
  mitigado en contrato.
- Runtime: `NOT_EXECUTED`; BE-029/MOB-009 deben probar respuesta perdida,
  concurrencia, conflicto fail-closed y limpieza Mobile.

## Evidencia y comandos

| Comando/inspección | Resultado |
|---|---|
| `git status --short`; `git rev-parse HEAD`; `git diff --stat` | Mismo HEAD `3fdf672...`, worktree documental sin commit candidato. |
| `git diff --check` | PASS; sin errores de whitespace. |
| SHA-256 de 14 rutas y del manifiesto ordenado `path=hash` | PASS; digest `c5accd84...878c30d0`. |
| `rg -n -C 4 'D9|D10|D11|D12|2026-07-31'` en historia/ADR/handoffs | PASS; decisión D1–D12 y aprobación humana trazables. |
| Inspección D9/OpenAPI/matriz | PASS documental: +2 min, código futuro, cero efectos, expiry seguro. |
| Inspección WS/matriz | PASS documental: reauth/revoke, publish/snapshot, carreras y cierre observable. |
| Inspección D10/OpenAPI/offline/matriz | PASS documental: ventana, offline, multi-device, 429 y telemetría saneada. |
| Inspección D11/OpenAPI/WS/offline | PASS documental: `mocked`/`UNKNOWN` coherentes. |
| Inspección D12/ADR-015/offline/restore | PASS documental: crypto-erasure, exclusión, cuarentena y limpieza. |
| `rg -n -C 6 'guarda de lote|replay exacto|acuse original|lote lógico nuevo|DUPLICATE' ...` | PASS: precedencia batch→sample coherente en ADR, OpenAPI, sync, matriz y QA. |
| QA actualizado | Reutilizado: `PASS` documental; cubre replay exacto, conflicto, lote nuevo y acuse inválido. |
| Maven/Flutter/E2E/runtime REST-WS-Redis-PostGIS-Mobile-backup | `NOT_EXECUTED`: no existe implementación EN-016. |
| Parser/linter OpenAPI/YAML | `NOT_EXECUTED`; no se instalaron dependencias ni se repitió la ausencia ya evidenciada por QA. |
| SAST/SCA/DAST/secret scan general | `NOT_EXECUTED`: diff documental sin código/dependencias/infra. |

## Controles no aplicables

- Secretos, dependencias/SBOM, imágenes, contenedores, CI/CD y puertos: no hay
  cambio de esas superficies.
- Archivos/importaciones, RabbitMQ/DLQ y mensajería externa: fuera del diff; la
  cola revisada es Mobile local.
- XSS/CSRF/source maps/tokens Frontend y claves de mapas: no hay implementación
  de pantalla o autenticación.
- SQL injection/deserialización y configuración Redis/TLS: no hay código ni
  configuración; solo se revisó el contrato lógico.

## Riesgos residuales

- Todos los controles cerrados son `PASS` documental y `NOT_EXECUTED` runtime;
  cada historia ejecutora debe aportar abuso negativo y evidencia del mismo
  commit antes de liberar tracking.
- El presupuesto numérico de rate-limit debe fijarse y observarse en la historia
  ejecutora; el fallo del limitador debe definirse fail-closed para el abuso sin
  convertir Redis en fuente de verdad.
- `mocked=false` sigue siendo declaración no confiable; D11 acepta explícitamente
  ese riesgo y prohíbe sanciones automáticas.
- La cola offline puede crecer hasta confirmación/resolución; debe conservar
  cifrado, bloqueo de ámbito y alertas sin coordenadas.
- El umbral `stale`, auditoría detallada y retención de visitas/ventas conservan
  los pendientes y responsables ya declarados.
- Cualquier cambio en las 14 fuentes invalida el digest y este retest.

## Pendientes y siguiente autorizado

1. DoF puede validar el cierre documental EN-016 sobre este digest y los handoffs
   QA/Seguridad `PASS`.
2. Las pruebas runtime permanecen para BE-029/030/034/054, MOB-009/030, FE-020 e
   INT-031; cada implementación requiere QA y Ciberseguridad del commit real.
3. No trasladar este PASS documental como aprobación de soporte excepcional,
   acceso runtime, anti-spoofing infalible o ejecución de purga/crypto-erasure.

Resultado final: `PASS`.
