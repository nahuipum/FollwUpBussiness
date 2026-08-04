# Handoff de remediación Backend — BE-007

## Estado

`READY_FOR_HANDOFF`

## Candidato y diff

- Base Git: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- El fingerprint funcional del paquete v2 (`c8ffbe5a5baebfaabfc4099b3be90a43fe884f9bb73694536994784834cf9181`) queda sustituido por esta remediación; el Orquestador debe emitir paquete v3 antes de la siguiente fase.
- Manifest SHA-256 del contenido de los 13 archivos funcionales Backend BE-007 no indexados: `4096cb98fd09df727dfc17710d58207cecfb6601617dd52b5729deeea36c7be7`.
- `git diff --check` y comprobación `--no-index --check` del archivo nuevo modificado: PASS.

## Alcance y archivos

- Corregido `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/ResourceAccessAuthorizer.java`: `SELLER` conserva propiedad y `SUPERVISOR` pertenencia vigente al equipo como límites obligatorios; un grant ya no es una alternativa que los amplíe. La auditoría recibe el `correlationId` de la operación y rechaza su ausencia.
- Actualizado `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/application/ResourceAccessAuthorizerTest.java` con negativas de bypass para ambos roles, propagación exacta del correlation ID y ausencia de ID fabricado.
- Creado este handoff: `docs/handoffs/development/BE-007-remediation-handoff.md`.

## Contratos y migraciones

- Sin cambio de OpenAPI ni de contrato REST.
- Sin migración nueva ni modificación de `V7__create_identity_access_teams_and_resource_grants.sql`; la auditoría sigue almacenando únicamente IDs técnicos, tipo de recurso y resultado.

## Matriz corrección → pruebas

| Hallazgo QA | Corrección | Prueba dirigida |
|---|---|---|
| Grant ampliaba el alcance de `SELLER` y `SUPERVISOR` | Se elimina el grant como ruta de autorización alternativa; se mantienen tenant + propietario/equipo. | `explicitGrantCannotBroadenSellerOwnershipOrSupervisorTeamScope` |
| Auditoría fabricaba un UUID | `canAccess` exige y reenvía `correlationId` al puerto de auditoría. | `accessDecisionAuditsTheOperationCorrelationIdWithoutCredentialsOrPersonalData`, `accessDecisionRequiresTheOperationCorrelationId` |

## Comandos y resultados

- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=ResourceAccessAuthorizerTest" test`: PASS, 5 pruebas.
- `mvn clean "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=ResourceAccessAuthorizerTest" test`: PASS, compilación limpia y 5 pruebas.
- `git diff --check`: PASS.
- `python -m graphify update .`: PASS; grafo local actualizado.

## Criterios cubiertos

- AC-01: decisión por rol y recurso se mantiene deny-by-default para los casos cubiertos.
- AC-02: supervisor sin membresía vigente queda denegado incluso con grant del tenant.
- AC-03: vendedor no propietario queda denegado incluso con grant del tenant; se conserva el rechazo cross-tenant.
- AC-04: el mismo `correlationId` de operación llega a auditoría; la interfaz no acepta credenciales, tokens, cabeceras ni payloads.
- AC-05: sin cambios de contrato ni derivación de identidad/tenant.

## Riesgos y reproducción

- Riesgo residual: no se ejecutó migración PostgreSQL/Testcontainers en esta remediación; QA ya registró Docker local no disponible. Validar en CI o con Docker antes del gate final.
- Riesgo residual: `ResourceAccessGrantQuery` permanece como dependencia de construcción para la capacidad BE-007, pero no amplía la política binaria de acceso; cualquier nuevo uso debe conservar los límites de rol y recurso aquí verificados.
- Reproducción del defecto cerrado: ejecutar `ResourceAccessAuthorizerTest`; con grant `true`, un vendedor ajeno y un supervisor sin equipo reciben `false`, y el capturador de auditoría recibe exactamente el UUID de correlación suministrado.

## Excepciones

- Ninguna lectura de fuente primaria adicional. Se usaron exclusivamente el paquete v2, el handoff QA, el candidato y código/pruebas afectados.
