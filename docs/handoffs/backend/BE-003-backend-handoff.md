# Backend Handoff — BE-003

## Estado

`BLOCKED`

BE-003 no se implementó: el snapshot `48ef86f` no proporciona una fuente de
verdad ni un contrato de `tenancy` para comprobar que una empresa está activa.
Implementar ese dato dentro de `identityaccess` inventaría un modelo y rompería
el límite modular.

## Alcance y cambios

- Alcance revisado: login seguro de BE-003 y sus criterios CA1–CA4.
- Cambio realizado: solo la evidencia de bloqueo
  `docs/handoffs/governance/BE-003-phase0-ready.md`.
- No hubo cambios en `backend/followupbussiness`, OpenAPI, ADR, migraciones,
  dependencias ni secretos. No se creó commit de implementación; este handoff
  se publica mediante un commit documental trazable.

## Contratos y migraciones

- Se conservaron sin cambios ADR-008 y `docs/api/openapi.yaml` (`/auth/login`).
- No se creó migración: V2 solo contiene `company_id` nullable en la cuenta;
  carece de FK, tabla o estado de empresa.
- Se requiere un puerto/contrato público de `tenancy` que derive la empresa de
  la cuenta, valide su estado y conserve aislamiento por tenant también al
  aceptar JWT en recursos protegidos.

## Criterios

| Criterio | Resultado |
|---|---|
| CA1, sesión con credenciales válidas | Diseño disponible en ADR-008; no implementado. |
| CA2, rechazar usuario o empresa inactiva | Bloqueado por ausencia de contrato/estado de empresa. |
| CA3, respuesta neutral | Diseño disponible en ADR-008; no implementado. |
| CA4, empresa y rol asociados a sesión | Bloqueado para ámbito empresa; no implementado. |

## Verificación y reproducción

- `git diff --check`: sin diferencias previas en el snapshot.
- Intento de Maven dirigido con JDK 21 y repositorio temporal:
  `mvnw.cmd -Dtest=AuthenticationContractPolicyTest,PlatformSuperadminBootstrapMigrationTest,SecurityConfigurationTest test`.
  El wrapper no pudo iniciarse en el sandbox; no produjo ejecución de tests ni
  evidencia válida.

Reproducir el bloqueo con las instrucciones de
`docs/handoffs/governance/BE-003-phase0-ready.md`.

## Riesgo y desbloqueo

Un login que ignore empresa inactiva o trate `company_id` como autoridad sería
incompatible con BE-003 y ADR-008. Se requiere decisión de Arquitectura/Product
Owner sobre el contrato de `tenancy`, estados empresariales, fuente de verdad y
orden de migración. Tras esa decisión deben ejecutarse las pruebas de login,
PostgreSQL/Testcontainers, JWT RS256, canales, rate limit, tenant/rol spoofing,
autorización runtime y arquitectura solicitadas.
