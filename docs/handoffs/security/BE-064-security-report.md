# Seguridad — BE-064

- Estado: `PASS`
- Candidate-ID: `HEAD+adf01a367feb39b36ddcf4aa7f9a80a41e0207a8` (HEAD `6c14ac05776ab279da1a4d35c86e22f9752448b3`; digest y `git diff --check`: PASS).

## Superficie revisada

`PUT /routes/{routeId}/points/order`: autorización `COMPANY_ADMIN`/`SUPERVISOR`, aislamiento tenant/equipo, permutación e `If-Match`, exclusión entre jornada y reordenamiento `PUBLISHED`, fallback del guard, transacción serializable, auditoría y outbox `route.modified` v1.

## Resultado y evidencia

- **PASS — BOLA/autorización:** `findForUpdate(tenantId, routeId)` filtra por tenant; luego el alcance vigente exige el vendedor de la ruta. El guard recibe tenant/vendedor/fecha derivados de la ruta ya autorizada.
- **PASS — carrera/fail-closed/rollback:** `PUBLISHED` rechaza outbox ausente, `STARTED`, `Unavailable` o estado no reconocido antes de snapshot/escritura/auditoría/evento. `TransactionTemplate` serializable envuelve guard, ruta, snapshot, auditoría y outbox JDBC. Se reutiliza EN-023 DoF `PASS` para bloqueo del triple exacto y rechazo de transacción ajena; QA reporta `clean verify` PASS del mismo candidato.
- **PASS — minimización:** `route.modified` contiene solo `routeId`, `tenantId`, versión y UUID técnico del vendedor; no incluye PII, coordenadas, tokens ni secretos. `DRAFT` no consulta jornada ni emite evento.
- **Abuso reproducido (BOLA, severidad potencial alta):** `ReorderRoutePointsServiceTest#tenantOrScopeDenialDoesNotReadSnapshotWriteOrAudit` PASS; supervisor fuera de equipo no produjo efectos ni outbox.

## Hallazgos y residual

Sin hallazgos (`FAIL`: ninguno). `NOT_EXECUTED`: no se repitió suite completa ni integración de mensajería; se reutilizó evidencia QA. WebSocket, cache/Redis, archivos, secretos, dependencias e infraestructura: no aplican al diff. Riesgo residual bajo: no existe prueba positiva aislada nombrada para supervisor dentro de equipo, aunque la condición fue revisada y su negativo pasó.
