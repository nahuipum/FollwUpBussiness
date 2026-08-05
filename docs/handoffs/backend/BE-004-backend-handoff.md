# Backend Handoff — BE-004

## Estado

BLOCKED

## Candidato y alcance

- Candidato de entrada: `a7e444a684d032be4da9ee4aac48528a33bd5fd7` más únicamente los artefactos de gobernanza ya presentes: `docs/handoffs/governance/BE-004-context-package.md` y `docs/handoffs/security/BE-004-preflight.md`.
- Diff de implementación BE-004: ninguno. No se modificó código, contrato OpenAPI, migraciones ni configuración.
- Este handoff es el único artefacto añadido por Desarrollo; no se alteraron cambios ajenos.

## Bloqueo verificable

`SEC-BE004-09` exige auditoría de los resultados críticos de refresh y `SEC-BE004-10` exige que esa auditoría participe de la misma transacción que consumo, sucesor y revocación.

El único puerto público de auditoría disponible, [`RecordAuditEntryUseCase`](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/port/in/RecordAuditEntryUseCase.java), recibe únicamente un comando sin tenant, actor ni correlationId. Su implementación obtiene esos datos mediante `AuditTrustedContextProvider`, cableado al adaptador `SecurityContextAuditTrustedContextProvider` en [`AuditConfiguration`](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/config/AuditConfiguration.java). `/auth/refresh` es deliberadamente anónimo: antes de una rotación válida no existe `AuthenticatedActor` en `SecurityContext`, y en resultados inválidos/replay nunca puede crearse uno.

Identityaccess tampoco puede sortearlo escribiendo la tabla o importando el adaptador de audit: contradice el límite de módulos de [`ModuleBoundaryTest`](../../../backend/followupbussiness/src/test/java/com/nahui/followupbussiness/architecture/ModuleBoundaryTest.java) y la regla del paquete que prohíbe acceder a tablas/repositorios internos de otro dominio. Un registro fuera de la transacción no cubriría SEC-BE004-10.

## Decisión mínima requerida

Definir y aprobar un contrato público de audit para operaciones anónimas de autenticación que:

1. acepte solo contexto confiable derivado de la familia persistida (tenant técnico nullable para plataforma, accountId, familyId y correlationId saneado), sin credenciales ni datos de cliente;
2. permita registrar resultado técnico de refresh en la transacción PostgreSQL de identityaccess, con semántica de fallo que revierta consumo/sucesor/revocación; y
3. preserve el límite modular mediante un puerto/adapter aprobado, sin acceso de identityaccess a tablas ni adaptadores internos de audit.

La alternativa válida es una decisión explícita que declare una auditoría append-only propiedad de identityaccess y sus reglas de retención/privacidad. Cualquiera de las dos alternativas cambia la integración interdominio y debe fijarse antes de implementar; no se introdujo un workaround.

## Criterios y controles

| Criterio/control | Estado | Evidencia |
|---|---|---|
| BE004-AC01 a AC03; SEC-BE004-01 a 08 | No iniciado | El bloqueo se detectó antes de crear un flujo parcial que no podría entregarse como seguro. |
| BE004-AC04 | Bloqueado | Requiere auditoría crítica trazable con correlationId. |
| SEC-BE004-09 | Bloqueado | El puerto existente requiere `SecurityContext`; no sirve para refresh anónimo. |
| SEC-BE004-10 | Bloqueado | No hay contrato que permita mantener auditoría y rotación en la misma transacción sin cruzar módulos. |

## Contratos y migraciones

- OpenAPI sin cambios. Lectura excepcional: `docs/api/openapi.yaml`, `/auth/refresh` y `MobileRefreshSessionRequest`, hash SHA-256 `8957594B552D75588DCF24CA1ADAC906AEBA7B7EE1A18B7722436875050792D9`. Motivo: el paquete no incluía el cuerpo/canal y los códigos exactos necesarios para evaluar el adaptador de entrada.
- No hay migración nueva; quedará condicionada a la decisión anterior.

## Comandos y resultados

- `mvn -q "-Dtest=LoginServiceTest,LoginControllerTest,LoginRateLimiterTest,Rs256AccessTokenAdapterTest,SecurityConfigurationTest" test`: PASS (pruebas dirigidas existentes del módulo, antes de cambios).
- `git diff --check`: PASS.
- No se ejecutaron suites adicionales: no existe diff de implementación ni pruebas pertinentes de refresh tras el bloqueo.

## Reproducción

1. Inspeccionar el contrato `RecordAuditEntryUseCase` y su implementación `RecordAuditEntry`.
2. Verificar que `AuditConfiguration` usa `SecurityContextAuditTrustedContextProvider`.
3. Invocar el flujo anónimo previsto para `/auth/refresh`: no existe actor autenticado del que obtener tenant/actor confiables para ese puerto.
4. Intentar importar `audit.adapter..` o escribir `audit_entry` desde identityaccess: el límite modular y las instrucciones locales lo prohíben.

## Riesgo

Implementar refresh sin la decisión produciría rotaciones sin auditoría completa o una auditoría no atómica; ambos incumplen los controles obligatorios y no son aceptables.
