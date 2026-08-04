# Handoff Desarrollo — BE-007 — Remediación de seguridad

## Estado

`READY_FOR_HANDOFF`

## Alcance

Se corrigió exclusivamente `SEC-BE007-001`. En cada autenticación, el
autenticador resuelve de PostgreSQL la sesión y cuenta vigentes y, para un
principal company-scoped, exige que `tenancy_company` exista y tenga estado
`ACTIVE`. Una empresa suspendida o inexistente no produce actor autenticado.
El caso platform-scoped permanece explícito: solo es válido con `tenantId`
persistido nulo; ningún tenant se acepta desde claims ni entrada cliente.

## Candidato y diff

- Base: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- Nuevo candidato: base más el working tree Backend BE-007 de 13 rutas; esta
  remediación modifica únicamente `InboundJwtAuthenticator` y su prueba.
- El fingerprint v3 (`d5697f…2057`) ya no aplica. El Orquestador debe
  recalcular el fingerprint canónico y emitir paquete v4 antes de QA/Seguridad.
- `git diff --check`: `PASS`.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticator.java`:
  unión durable a `tenancy_company` y filtro de empresa `ACTIVE` para tenant
  no nulo.
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticatorTest.java`:
  negativos de empresa suspendida e inexistente, y cobertura explícita de
  principal platform-scoped sin tenant.

## Contratos y migraciones

No se modificaron contratos públicos ni migraciones. Se reutiliza la fuente de
verdad existente `tenancy_company.status` indicada por el handoff de seguridad.

## Hallazgo → evidencia

| Hallazgo | Prueba/evidencia | Resultado |
|---|---|---|
| SEC-BE007-001: empresa `SUSPENDED` conserva token | `rejectsCompanyTokenWhenTheDurableCompanyIsSuspended` | PASS |
| SEC-BE007-001: empresa inexistente conserva token | `rejectsCompanyTokenWhenTheDurableCompanyNoLongerExists` | PASS |
| Plataforma sin tenant de cliente | `acceptsPlatformTokenOnlyWhenThePersistedActorHasNoTenant` | PASS |
| Consulta durable exige empresa activa | aserción SQL en `acceptsSignedCompanyTokenOnlyWhenItsTenantComesFromThePersistedSession` | PASS |

## Comandos y resultados

- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=InboundJwtAuthenticatorTest" test`: PASS, 4 pruebas.
- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=InboundJwtAuthenticatorTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 9 pruebas.
- `git diff --check`: PASS.
- Se intentó `mvn clean ...`; el clean no pudo borrar `backend/followupbussiness/target` por bloqueo local. La ejecución posterior recompuso/ejecutó la selección y pasó; no se eliminó ningún artefacto manualmente.

## Criterios y riesgos

- Cubre el cierre por defecto ante empresa suspendida, inexistente o no resoluble, y conserva aislamiento tenant y principal platform-scoped.
- Riesgo residual: las negativas son unitarias y modelan la ausencia de fila tras el filtro SQL; queda pendiente la integración PostgreSQL/Testcontainers de V4/V7 ya reportada por Seguridad.
- `graphify update .` no se pudo ejecutar: `graphify` no está en PATH y `python -m graphify` fue bloqueado por el entorno. No afecta el build ni el diff; actualizar el grafo cuando el entorno lo permita.

## Excepciones de lectura

Ninguna. Se usaron exclusivamente el paquete v3, el handoff de Seguridad y las dependencias directas de código/datos autorizadas por dicho handoff.
