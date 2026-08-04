# Security Handoff — BE-051

## Estado

`CHANGES_REQUIRED`

## Candidato y evidencia

- Base: `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384`.
- Handoff Dev v2: SHA-256 `7391469209597f639605b48c1e20158f6ffe7a3750aede511cc6538a4adbd783`; ADR-016/020 coinciden con el paquete v3.
- Snapshot independiente de las 19 rutas auditadas, `SHA-256(path<TAB>hash LF)`: `fd405b26e440dcd6b3950f14d202833f9585f7bd96ddbc505c69c6d956372740`.
- El manifest del paquete `8db12091…6423ca` no se pudo recalcular porque no publica inventario ni algoritmo de composición.
- PR y CI: inexistentes por instrucción del usuario. Worktree no versionado.

## Hallazgos

| ID | Severidad | Estado | Evidencia e impacto | Corrección exigida |
|---|---|---|---|---|
| SEC-BE051-001 | Medium | Abierto | V8 no aplica `REVOKE`/`GRANT`, RLS, trigger ni función privilegiada; runtime y Flyway usan la misma credencial; `AuditEntryStore` expone append y purga con el mismo `JdbcTemplate`. Esa credencial puede modificar/borrar entradas o leer IP. | Separar rol propietario/migrador, writer append-only y purger; revocar `UPDATE`, `DELETE` y lectura de IP al runtime; purga mediante función/rol dedicado y pruebas negativas de privilegios. |
| SEC-BE051-002 | Medium | Abierto | `occurredAt` viene de `AuditEntry` y se persiste sin `Clock`; la purga depende de ese valor. Backdating elimina evidencia pronto y fechas futuras eluden 365/90 días. | Generar hora con `Clock` confiable o PostgreSQL; no aceptar fecha libre del productor; derivar hora de red de la entrada y probar fechas pasada/futura. |
| SEC-BE051-003 | Medium | Abierto | El use case recibe `AuditEntry` completo; tenant/actor/correlación/scope son libres y scope/resourceType solo limitan longitud. Un productor puede forjar tenant/actor o persistir PII/secretos. | Comando sin tenant/actor/correlación/hora libres; derivarlos de contexto confiable; autorización de recurso en productor; vocabularios controlados para acción, recurso y scope. |

## Controles comprobados

| Control | Resultado |
|---|---|
| FK compuesta entry/tenant para contexto de red; ausencia de REST público nuevo; SQL parametrizado | PASS |
| Allowlist `before`/`after`, restricciones acción/resultado/correlación, serialización JSON | PASS |
| Idempotencia/concurrencia, orden red→entry, corte y lotes 500, scheduler sin tags sensibles | PASS |
| Append-only efectivo por privilegios; hora servidor; procedencia confiable tenant/actor/scope | FAIL — hallazgos anteriores |
| Backup/restore de datos vencidos | NOT_EXECUTED — sin evidencia operativa candidata |

## Pruebas y riesgos

- `AuditEntryTest,AuditEntryMigrationTest`: PASS, 4/4 con PostgreSQL 17.5, Testcontainers y Flyway V1–V8; primera ejecución sandbox no ejecutó integración por pipe Docker y se repitió autorizada.
- No se repitieron arquitectura, SAST, SCA o DAST: QA ya aprobó arquitectura, no cambiaron dependencias y no existe endpoint.
- Riesgos: restore puede reintroducir vencidos; scheduler no se probó multiinstancia/>500; manifest no verificable; contratos inseguros se volverían explotables al conectar productores.

## Excepciones de fuentes

Necesarias por los hallazgos: `docs/security/security-baseline.md` (`16ca93ca…03ecdb0`), `docs/security/threat-model.md` (`4cf29685…1279ad3`) y `agents/security/08_cybersecurity_reviewer.md` secciones 3–7 y 9 (`5cc1a261…53e949c`). No se releyeron HU, contrato, API traceability ni ADR ya trazados.
