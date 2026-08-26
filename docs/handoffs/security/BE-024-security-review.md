# BE-024 — Revisión de Ciberseguridad

**Estado:** `PASS`  
**Candidate-ID:** `538b07a + 005b1cc458c4`

## Superficie revalidada

Los dos hallazgos altos previos: arranque con outbox deshabilitado y frontera transaccional ruta–auditoría–outbox–idempotencia. Se comprobó además que el delta no reabrió autorización/tenant/equipo, BOLA, minimización del envelope, `notifySeller` ni aislamiento de BE-053/Mobile.

## Cierre de hallazgos

1. **Alta previa — PASS — arranque fail-safe.** `RoutingConfiguration` registra `unavailablePublishRouteUseCase` cuando `followupbussiness.outbox.enabled=false`, sin inyectar `OutboxStore`; el controller traduce `Unavailable` a 503 y el servicio con efectos no es alcanzable. Reproducción: `mvn -q "-Dtest=FollowupbussinessApplicationTests,PublishRouteServiceTest" test` — PASS; el contexto inició sin store y con un único `PublishRouteUseCase`.

2. **Alta previa — PASS — atomicidad efectiva.** Con outbox habilitado, el bean crea un `TransactionTemplate`, fija `ISOLATION_SERIALIZABLE` y ejecuta dentro de él todo `PublishRouteService`: reserva/completado idempotente, transición, auditoría y append de outbox. Ruta, auditoría transaccional y outbox usan el mismo `JdbcTemplate`/transaction manager; las excepciones runtime revierten la unidad. Ya no se depende de proxy AOP sobre el servicio. La inspección estática y la evidencia Dev/QA cierran el control; una inyección real de fallo de persistencia quedó **NOT_EXECUTED** por no existir prueba focal en el candidato.

## Controles sin regresión

- **PASS:** actor y tenant de sesión, roles `COMPANY_ADMIN`/`SUPERVISOR`, ruta tenant-scoped, equipo vigente, vendedor activo y orden de autorización previo a idempotencia/escrituras.
- **PASS:** BOLA/IDs manipulados sin efectos; replay aislado por tenant, actor y operación, sin duplicar write, auditoría ni evento.
- **PASS:** `route.published` conserva solo IDs técnicos, fecha/versión, `correlationId` y `notifySeller`; no incluye PII, coordenadas, tokens ni payload completo. `notifySeller=false` no suprime evento ni destinatario y no introduce lógica BE-053/Mobile.
- **NO APLICA:** secretos, archivos, WebSocket, cache/Redis y nuevas dependencias.

## Hallazgos y riesgos residuales

Sin hallazgos abiertos. Riesgo residual bajo: falta una prueba de integración que fuerce fallo de auditoría/outbox y consulte cero efectos persistidos. Delivery, validación del consumidor y supresión exclusiva del push siguen en BE-053.
