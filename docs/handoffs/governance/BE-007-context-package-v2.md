Exit code: 0
Wall time: 0.4 seconds
Output:
# Paquete de Contexto de Historia — BE-007 — v2

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-007-gestionar-roles-y-permisos.md` — SHA-256 `650c999218c7d9559c8b9e9a2a5a46bdd7bdde2ba2213cf767df2d9fd23242b3` |
| Commit o diff candidato | Base/HEAD Git `f320938d55f8ca9bf58d0df0bab259749ca5974e` en rama `feature/first` + diff funcional Backend BE-007 no indexado con SHA-256 `c8ffbe5a5baebfaabfc4099b3be90a43fe884f9bb73694536994784834cf9181`; `git diff --check` PASS. Excluye artefactos de gobernanza y handoffs. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Cambio respecto de v1

- Motivo: Desarrollo modificó código y migración de BE-007; no cambió ninguna fuente funcional, contractual, ADR o de seguridad.
- Handoff de origen: `docs/handoffs/development/BE-007-development-handoff.md` (`READY_FOR_HANDOFF`).
- Excepción registrada por Desarrollo: relectura de `docs/api/openapi.yaml`, `/me` (`getCurrentUser`) y `CurrentUser`/`UserSummary`, SHA-256 sin cambio `8957594b552d75588dcf24ca1adac906aeba7b7ee1a18b7722436875050792d9`; no hubo cambio contractual.
- Candidato QA/Seguridad/DoF: el diff funcional identificado arriba; cualquier modificación posterior exige v3.

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| AC-01 | Toda operación protegida valida permiso además de identidad autenticada. | HU, «Criterios de aceptación» 1; `00_CONTRATO_FUNCIONAL.md`, §8.1/RF-AUT-003 y §9/RNF-006 | `650c999…42b3`; `62974d…6b2` |
| AC-02 | Un supervisor solo obtiene acceso a recursos de su equipo vigente, dentro de su tenant. | HU, «Criterios de aceptación» 2; `00_CONTRATO_FUNCIONAL.md`, §6.2 y §17.4 | `650c999…42b3`; `62974d…6b2` |
| AC-03 | Un vendedor solo obtiene acceso a su propia información, dentro de su tenant. | HU, «Criterios de aceptación» 3; `00_CONTRATO_FUNCIONAL.md`, §6.3 y §17.4 | `650c999…42b3`; `62974d…6b2` |
| AC-04 | Cada cambio de rol/permisos o decisión crítica queda auditado sin secretos ni datos personales completos. | HU, «Criterios de aceptación» 4 y «Seguridad y privacidad»; `00_CONTRATO_FUNCIONAL.md`, §8.9/RF-AUD-001..002 y §9/RNF-008 | `650c999…42b3`; `62974d…6b2` |
| AC-05 | Se preservan contrato y compatibilidad: tenant/usuario se derivan de la identidad; roles de endpoint no sustituyen la autorización por objeto. | HU, «Contratos y superficies»; `docs/api/TRACEABILITY.md`, §Reglas transversales verificables 1..3 | `650c999…42b3`; `dadd76…7a67` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Hash de fuente | Aplicación esperada |
|---|---|---|---|---|
| R-01 | `tenant_id` obligatorio; tenant derivado de sesión; cada módulo prueba acceso cruzado. | `docs/architecture/adr/ADR-002-aislamiento-multiempresa.md`, única sección | `f2e5c4…624c` | Persistencia, consultas y decisiones de acceso filtran y verifican el tenant; pruebas negativas cross-tenant. |
| R-02 | Catálogo cerrado: `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR`, `SELLER`; valores del cliente no otorgan rol. BE-007 define asignaciones, permisos por recurso, equipos, auditoría y autorización multiempresa; roles personalizados siguen fuera de alcance. | `ADR-011-catalogo-roles-base.md`, §Decisión/Códigos y ámbitos, §Evolución, §Consecuencias/Riesgos residuales | `a3f8a7…1ac5` | Reutilizar códigos y ámbitos estables; modelar asignaciones por tenant y no abrir creación/elevación arbitraria. |
| R-03 | Deny by default; 401 para no autenticado y 403 para autenticado sin autorización; ninguna respuesta filtra secretos/tokens/datos sensibles. | `ADR-010-linea-base-seguridad-secretos-locales.md`, §Política deny by default y §Evolución de identidad y acceso | `70ae30…096` | Conservar la cadena Spring Security y cubrir negativas de autenticación/autorización. |
| R-04 | JWT/claims no sustituyen relaciones persistidas; servidor valida en cada solicitud cuenta, empresa y autorización por recurso; `tid` no viene del cliente. | `ADR-008-autenticacion-sesiones.md`, §Credencial de acceso y §Persistencia, cache y aislamiento multiempresa | `26542b…0dec` | Resolver identidad/tenant de la sesión validada y comprobar pertenencia a equipo/recurso en servidor. |
| R-05 | Auditoría permitida: correlationId, operación, resultado y UUID/tenant técnicos cuando aplique; prohibidos login completo, credenciales, tokens, cabeceras y payloads completos. | `ADR-008-autenticacion-sesiones.md`, §Auditoría y observabilidad; `shared/ENGINEERING_RULES.md`, §7 | `26542b…0dec`; `77ea1c…050` | Auditoría y logs seguros, con `correlationId`, operación y resultado, sin PII/secreto. |
| R-06 | RBAC no basta: autorización por recurso/objeto y tenant derivado de sesión; mitigar escalación de privilegios y acciones no auditadas. | `docs/security/security-baseline.md`, lista; `docs/security/threat-model.md`, §Amenazas STRIDE/§Controles | `16ca93…db0`; `4cf296…9ad3` | Pruebas de abuso: rol insuficiente, recurso ajeno, equipo ajeno, tenant ajeno y elevación. |
| R-07 | Validar entrada, respuestas tipadas y errores consistentes; contrato actualizado antes del handoff. | `shared/ENGINEERING_RULES.md`, §4 API y §6 Pruebas mínimas | `77ea1c…050` | No modificar OpenAPI silenciosamente; actualizarlo y evidenciar compatibilidad si cambia. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| REST/OpenAPI | `docs/api/openapi.yaml`, `/auth/me` (`getCurrentUser`, líneas 290..307) y `CurrentUser` (línea 2884); SHA-256 `8957594b552d75588dcf24ca1adac906aeba7b7ee1a18b7722436875050792d9` | Implementar o preservar la consulta de identidad, roles y permisos actuales sin ampliar silenciosamente el contrato. | FE-003, MOB-001, BE-003, BE-007. |
| REST/OpenAPI futuro relacionado | `docs/api/openapi.yaml`, `/company/users*` (líneas 461..577), propietarios `COMPANY_ADMIN`; mismo hash | No implementar una mutación de usuarios/roles que contradiga BE-058 ni cambie esta superficie sin coordinación contractual. | BE-058, FE-004, INT-033. |
| Reglas API transversales | `docs/api/TRACEABILITY.md`, §Reglas transversales verificables; SHA-256 `dadd7643bfff1d712d73541a68a1a2a0373fb2c7d42774c314910b9980b07a67` | Mantener bearerAuth, derivación de tenant y `application/problem+json` con correlationId. | Todos los clientes API. |
| Datos/identidad | `backend/followupbussiness`, dominio `identityaccess`; catálogo `identity_access_role_catalog` de ADR-011 | Nuevas relaciones/migraciones, si son necesarias, deben ser forward-only y conservar el catálogo cerrado. | BE-003, BE-008, BE-011 y posteriores recursos protegidos. |
| Auditoría | Puerto público hacia `audit` cuando esté disponible, según ADR-008 §Auditoría y observabilidad | Registrar cambios/decisiones con campos permitidos; no acceso directo a repositorios internos de otro dominio. | Auditabilidad, operaciones y seguridad. |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Asignaciones persistentes, permisos por recurso, equipo y autorización multiempresa | Dentro de alcance | HU «Alcance»/criterios; ADR-011 §Evolución. |
| Catálogo de roles base cerrado | Restricción | ADR-011 §Códigos y ámbitos; añadir/renombrar roles exige ADR sustituto. |
| Roles arbitrarios/personalizados, registro público y autenticación social | Fuera de alcance | HU «Fuera de alcance». |
| Cruce de tenant, acceso fuera de equipo/propio y escalación de privilegios | Riesgo crítico a revisar | HU «Riesgos conocidos»; ADR-002; threat model. |
| Auditoría incompleta o filtración de secretos/PII | Riesgo alto a revisar | HU «Seguridad y privacidad»; ADR-008 §Auditoría y observabilidad. |
| Contrato `GET /auth/me` y las futuras superficies `/company/users*` | Riesgo de compatibilidad | HU «Contratos y superficies»; OpenAPI y TRACEABILITY citados. |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Desarrollo | Paquete v1; candidato base fijado | `docs/handoffs/development/BE-007-development-handoff.md` con `READY_FOR_HANDOFF` | Implementación y pruebas dirigidas; declarar lecturas excepcionales. |
| QA | Este paquete v2 + handoff Dev + candidato fijado | `docs/handoffs/qa/BE-007-qa-handoff.md` con `PASS` | Matriz criterio → prueba y revisión independiente. |
| Seguridad | Este paquete v2 + handoff QA + candidato fijado | `docs/handoffs/security/BE-007-security-handoff.md` con `PASS` | Revisión obligatoria de autorización, multiempresa y auditoría. |
| DoF | Este paquete v2 + todos los handoffs + PR/CI | `docs/handoffs/dof/BE-007-dof-handoff.md` con `PASS` o `BLOCKED` | Mismo candidato, commit revisable, PR trazable y CI asociado. |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de
hash invalida este paquete y requiere una nueva versión del Orquestador.


