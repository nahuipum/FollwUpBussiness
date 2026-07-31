# Security Review — EN-011

## Estado

`PASS`

Retest independiente sobre `7f8a2717a5aa70d101affec202bba0e767add057` de `feature/en-011-closure`. Sustituye el PASS histórico invalidado por la contradicción objetiva de su evidencia SCA. No quedan hallazgos Critical, High, Medium o Low abiertos; `SEC-EN011-001` y `SEC-EN011-002` están cerrados en el artefacto exacto.

## Triage y alcance

Aplica por catálogo de roles/autorización futura, dependencias Backend y CI/SCA. Se revisaron historia, ADR-011 aceptado, política SCA, manifiesto, handoff Desarrollo `READY_FOR_HANDOFF`, QA `PASS` del mismo SHA, diff `df18774c1b15fb0fed3a421258ba9032ae81ffc3..7f8a2717a5aa70d101affec202bba0e767add057`, workflow/prueba de política/POM, catálogo y migraciones solo para descartar elevación, y el ZIP/extracción `backend/followupbussiness/target/backend-en011-closure-7f8a2717a5aa70d101affec202bba0e767add057-2.zip` / `backend/followupbussiness/target/en011-run-30601633807`. EN-012/013 y otras superficies ajenas al diff quedan fuera.

## Identidad e integridad

| Control | Evidencia | Resultado |
|---|---|---|
| SHA/run | HEAD y manifiesto: `7f8a271...add057`; run `30601633807`, attempt 2, job `91072356994` success según Desarrollo/QA del mismo SHA | PASS |
| Digest lógico | 16 fuentes limpias; `8062754176a5fbc837ddeea1f36636cd4814e1b85a837bd896066d2217f28db6` | PASS |
| ZIP | SHA-256 `C2D06BCC78982EF409453587405582B86CBBA8DFF56891061C65DB77358D892C` | PASS |
| Entregables/allowlist | 64/64 hashes; 65/65 archivos permitidos; sin faltantes, extras, duplicados o enlaces | PASS |
| ZIP seguro | 65 entradas; sin ruta absoluta, `..` ni diferencia byte a byte frente a extracción | PASS |
| Secretos | 0 nombres sensibles y 0 firmas en payload y 243 entradas del JAR | PASS |

Hay cambios concurrentes ajenos; ninguna de las 16 fuentes del digest estaba modificada y esos cambios no se aprueban aquí.

## Modelo de amenazas

Activos: integridad/ámbito de roles; conexión Backend–PostgreSQL; futuros DTO/autorización; árbol Maven, JAR, SBOM y SCA; secretos del runner; trazabilidad. Actores/límites: cliente–Spring, contribuidor/PR–workflow, commit–runner, Maven/SBOM–Trivy, cache DB–reporte/gate, staging–artifact store, Backend/Flyway–PostgreSQL.

| Abuso | Control | Resultado |
|---|---|---|
| Cliente declara/eleva rol | Sin endpoint/DTO/comando/evento/asignación; catálogo cerrado; deny-by-default | MITIGADO |
| Alterar código/scope/version | Enum, PK/CHECK y seed server-owned; sin cambio funcional | MITIGADO |
| Reintroducir pgJDBC 42.7.11/Jackson 3.1.4 | Baseline, POM, árbol, JAR, SBOM y SCA | MITIGADO |
| Ocultar High/Critical | Sin `.trivyignore`; unfixed incluidos; exit 1 y fallo terminal | MITIGADO |
| Usar otra base Trivy | Mismo cache explícito; hashes/tamaños/fechas | MITIGADO |
| Exfiltrar workspace/secretos | Staging cerrado, rechazo de enlaces/nombres/firmas, también dentro del JAR | MITIGADO |
| Sustituir evidencia | SHA ZIP, 64/64 hashes, digest y commit/run | MITIGADO |

## SCA, SBOM y dependencias

| Evidencia | Resultado | Estado |
|---|---|---|
| Trivy | 0.70.0, schema 2, un resultado Java/JAR, 0 vulnerabilidades | PASS |
| Gate | `TRIVY_GATE_HIGH_CRITICAL=PASS`, 0 High/Critical | PASS |
| Base/fecha | UpdatedAt `2026-07-31T01:16:01.565726584Z`; DownloadedAt `2026-07-31T03:30:02.821943467Z`; observedAt `2026-07-31T04:23:59Z`; cronología válida | PASS |
| Identidad DB | `trivy.db` SHA `8faf2dd475b4df974d0f4d1aad25c8f4bae9fbe163d1969f6de1541ca781ac04`, 1228570624 bytes; `metadata.json` SHA `c25bbb8126674f473767c1a92f09a068f84fffcc1e13059e97a952b2cce267d1`, 153 bytes | PASS |
| SBOM | CycloneDX 1.6, 58 componentes | PASS |
| pgJDBC | POM/árbol/SBOM/JAR: 42.7.12; 42.7.11 ausente | PASS |
| Jackson | POM/árbol/SBOM/JAR: 3.1.5; 3.1.4 ausente | PASS |
| SAST | `SAST_CONFIG_MISSING` | NOT_EXECUTED |

El SBOM es inventario; la conclusión SCA procede de `trivy-sca-full.json` y el gate de los reportes/estado High/Critical.

## Hallazgos

### SEC-EN011-001 — pgJDBC vulnerable a downgrade de channel binding

- Severidad original: High; activo: autenticidad/integridad Backend–PostgreSQL.
- Condición original: pgJDBC 42.7.11, CVE-2026-54291.
- Abuso reproducible: resolver POM/árbol o abrir `BOOT-INF/lib` y comprobar si existe `postgresql-42.7.11.jar`; en la versión afectada un atacante en posición de red podría intentar degradar channel binding.
- Cierre: POM, árbol, SBOM y JAR contienen 42.7.12; baseline PASS; Trivy 0 vulnerabilidades.
- Estado: `CLOSED`.

### SEC-EN011-002 — Jackson Databind vulnerable a bypass de `@JsonView`

- Severidad original: Medium; activo: integridad de futuros DTO/autorización.
- Condición original: Jackson Databind 3.1.4, CVE-2026-59889.
- Abuso reproducible: resolver POM/árbol o abrir `BOOT-INF/lib` y comprobar si existe `jackson-databind-3.1.4.jar`; un DTO con las anotaciones afectadas podría aceptar campos fuera de la vista autorizada.
- Cierre: POM, árbol, SBOM y JAR contienen 3.1.5; baseline PASS; Trivy 0 vulnerabilidades.
- Estado: `CLOSED`.

No se identificaron nuevos Critical/High ni hallazgos Medium/Low reproducibles dentro del alcance.

## Controles no aplicables

- Autenticación funcional, sesión/JWT y autorización por recurso: EN-011 no las implementa; conserva deny-by-default.
- `tenantId` en asignaciones: catálogo global por ADR-011, sin usuarios ni relaciones tenant-rol.
- PII, geolocalización/PostGIS, Frontend, Mobile/local/offline, WebSocket, Redis, RabbitMQ, archivos de negocio.
- DAST autenticado, imagen e infraestructura: no hay endpoint, imagen ni cambio infra en el diff.

## Validaciones reutilizadas/no ejecutadas

Se reutilizaron 129 tests, 0 fallos, 0 errores y 5 opt-in omitidos del run remoto; sus reportes están hasheados en el artefacto del mismo SHA. No se repitió Maven por ausencia de inconsistencia. SAST: `NOT_EXECUTED`; no se presenta como PASS. No se ejecutaron escaneos generales, DAST ni pruebas de red fuera del diff.

## Riesgos residuales

- La base Trivy refleja conocimiento a `2026-07-31T04:23:59Z`; un cambio o nueva vigencia exige SCA actualizado.
- Retención remota 30 días: conservar SHA, digest, run/attempt/job y ZIP.
- SAST ausente; no equivale a cobertura estática.
- El catálogo no autoriza operaciones: EN-012, BE-057, BE-003 y BE-007 deben revisar identidad, asignación persistida, tenant, permiso y autorización por objeto.
- Reevaluar overrides pgJDBC/Jackson al actualizar Spring Boot; no degradarlos ni fragmentarlos.

## Evidencia reproducible

- `git rev-parse HEAD` y diff base→candidato.
- Recalcular las 16 fuentes del manifiesto.
- `Get-FileHash -Algorithm SHA256` del ZIP.
- Verificar `deliverables.sha256`, allowlist y seguridad de rutas.
- Parsear reportes Trivy/base/gate.
- Contrastar pgJDBC/Jackson en SBOM, POM efectivo, árbol y `BOOT-INF/lib`.

## Recomendación final

EN-011 puede avanzar a Definition of Finished sobre este SHA/digest/run/artefacto. Cualquier cambio material invalida el resultado y exige nueva revisión.

`PASS`