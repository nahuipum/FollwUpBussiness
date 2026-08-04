# Handoff Ciberseguridad — BE-007

## Estado

`CHANGES_REQUIRED`

La autorización por recurso conserva el aislamiento por tenant, propietario y
equipo y evita que los grants amplíen el alcance de `SELLER` o `SUPERVISOR`.
Sin embargo, la autenticación de cada request no revalida que la empresa de una
cuenta company-scoped continúe `ACTIVE`. Una empresa suspendida puede conservar
acceso mediante una sesión y un access token emitidos antes de la suspensión.

## Triage y candidato verificado

- Revisión obligatoria: el diff cambia autenticación/autorización, `tenantId`,
  relación durable sesión-cuenta-rol, permisos por objeto, equipos, grants,
  auditoría y migración multiempresa.
- Base/HEAD verificada: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- Alcance funcional: 13 archivos bajo `backend/followupbussiness` (3
  modificados y 10 nuevos), excluyendo gobernanza y handoffs.
- Fingerprint SHA-256 recalculado con el algoritmo canónico del paquete:
  `d5697f492c8ef7488cc4d6d4986b6632c5cd4dec2bee2777b82e23d3b5e62057`.
- `git diff --check`: `PASS`.
- Handoff QA de entrada: `PASS` sobre el mismo candidato/fingerprint.

## Superficie revisada

- Validación de JWT y resolución server-side de sesión, cuenta, rol y tenant.
- Principal `AuthenticatedActor` y autoridades Spring Security.
- Política `ResourceAccessAuthorizer` para plataforma, administrador de
  empresa, supervisor y vendedor.
- Consultas persistidas de equipo y grants; prevención de bypass por grant.
- Auditoría de decisiones con `correlationId` e identificadores técnicos.
- Migración V7: equipos, miembros, grants, auditoría, PK/FK, unicidad e índices.
- Dependencias directas necesarias para evaluar el riesgo: estado
  `tenancy_company`, creación de sesiones en login y consumo del autenticador
  por la cadena de seguridad.

No hubo cambios de dependencias, secretos, WebSocket, cache/Redis, mensajería,
archivos ni infraestructura desplegable.

## Modelo de riesgo del cambio

### Activos

- Datos y recursos aislados por empresa.
- Sesiones, cuentas y asignación efectiva de rol.
- Membresías vigentes de equipo y propiedad del recurso.
- Integridad y minimización del rastro de auditoría.

### Actores

- Usuario legítimo de empresa con rol `COMPANY_ADMIN`, `SUPERVISOR` o `SELLER`.
- Usuario de una empresa posteriormente suspendida que conserva credenciales y
  sesión válidas.
- `PLATFORM_SUPERADMIN` con alcance global.
- Atacante con bearer token inválido, alterado o perteneciente a otra sesión.

### Límites de confianza

1. Bearer token no confiable -> verificación criptográfica y claims.
2. Claims firmados -> estado durable de sesión/cuenta/rol/tenant en PostgreSQL.
3. Principal autenticado -> política por tenant, dueño o equipo persistido.
4. Decisión -> persistencia de auditoría con datos técnicos mínimos.

### Escenarios de abuso evaluados

| Escenario | Resultado |
|---|---|
| Alterar token o presentar sesión inexistente/revocada/expirada | `PASS`: rechazo y error genérico. |
| Usar un `tenantId` del cliente para cambiar el tenant efectivo | `PASS`: el principal usa `account.company_id` persistido y exige coherencia con la sesión. |
| Mantener un rol antiguo tras cambiar `account.role_code` | `PASS`: el rol firmado debe coincidir con el rol persistido cerrado. |
| Vendedor accede a recurso ajeno o cross-tenant | `PASS`: exige tenant y propietario. |
| Supervisor accede fuera de su equipo vigente o cross-tenant | `PASS`: exige tenant y membresía persistida. |
| Grant explícito amplía el alcance obligatorio de vendedor/supervisor | `PASS`: los grants no participan en esas decisiones. |
| Empresa suspendida reutiliza sesión/token emitidos cuando estaba activa | `FAIL`: el autenticador no consulta el estado vigente de la empresa. |
| Inyectar SQL mediante `resourceType`/identificadores | `PASS`: consultas parametrizadas; no se observó concatenación SQL. |
| Filtrar credenciales, token o PII completa en auditoría | `PASS`: el adaptador persiste UUID técnicos, tipo y resultado; no persiste bearer, cabeceras, login ni payload. |

## Hallazgos

### SEC-BE007-001 — Alta — Sesiones de empresa suspendida siguen autenticando

**Resultado:** `FAIL`.

**Evidencia:**

- `InboundJwtAuthenticator.java:54-60` consulta únicamente
  `identity_access_session_family` e `identity_access_account`; valida sesión,
  expiración, revocación, estado de cuenta, rol y coherencia de `company_id`,
  pero no consulta `tenancy_company.status`.
- `InboundJwtAuthenticator.java:61-67` crea un principal autenticado para
  cualquier coincidencia única, incluida una cuenta cuyo tenant esté
  suspendido.
- `V4__create_tenancy_company_access_status.sql:1-11` define
  `tenancy_company.status` como fuente persistida con valores `ACTIVE` y
  `SUSPENDED`.
- `LoginService.java:49-50` comprueba `companies.isActive(...)` al iniciar
  sesión, lo que confirma que la suspensión bloquea nuevos logins, pero esa
  validación no se repite al autenticar requests posteriores.
- El test `acceptsSignedCompanyTokenOnlyWhenItsTenantComesFromThePersistedSession`
  simula directamente el resultado de la consulta del autenticador y no cubre
  empresa suspendida o inexistente.

**Abuso reproducible:**

1. Una cuenta company-scoped inicia sesión cuando su empresa está `ACTIVE` y
   recibe token/sesión válidos.
2. Se cambia `tenancy_company.status` a `SUSPENDED` sin alterar la cuenta ni la
   familia de sesión.
3. El usuario envía el bearer token no expirado.
4. La consulta de `InboundJwtAuthenticator` sigue devolviendo el
   `account.company_id`, crea `AuthenticatedActor` y la cadena permite cualquier
   endpoint autenticado o autorizado para ese rol.

**Impacto:** se elude la suspensión operativa del tenant hasta que expiren o se
revoquen todas sus sesiones. Un administrador, supervisor o vendedor suspendido
puede seguir accediendo a recursos permitidos por su rol dentro del tenant.

**Remediación requerida:**

- Revalidar en cada request que todo principal company-scoped pertenece a una
  empresa actualmente `ACTIVE`, mediante un puerto/proyección autorizada o una
  resolución durable equivalente; fallar cerrado si la empresa no existe, está
  suspendida o no se puede resolver.
- Mantener el caso platform-scoped (`tenantId == null`) explícito y sin aceptar
  el tenant desde claims o entrada del cliente.
- Añadir una prueba negativa donde sesión, cuenta y rol son válidos pero la
  empresa está `SUSPENDED`, y otra para empresa inexistente si la persistencia lo
  permite.
- La revocación masiva de sesiones al suspender una empresa puede añadirse como
  defensa en profundidad, pero no sustituye la revalidación server-side exigida
  por request.
- La corrección cambia el candidato y requiere paquete/fingerprint nuevo antes
  de repetir QA y Seguridad.

## Evidencia ejecutada y reutilizada

| Evidencia | Estado | Resultado |
|---|---|---|
| Recalcular HEAD, 13 rutas y fingerprint canónico | `PASS` | Coincide exactamente con paquete v3. |
| Revisión estática dirigida de autenticación, autorización, SQL, migración y auditoría | `FAIL` | Detecta `SEC-BE007-001`. |
| `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=ResourceAccessAuthorizerTest,InboundJwtAuthenticatorTest" test` | `PASS` | 7 pruebas, 0 fallos/errores; confirma controles cubiertos, no el estado vigente de empresa. |
| `BaseRoleCatalogMigrationTest` del handoff QA, mismo fingerprint | `NOT_EXECUTED` | Testcontainers no conectó con Docker local; no se repitió sin cambio de entorno. |
| Prueba dinámica de empresa suspendida con PostgreSQL real | `NOT_EXECUTED` | No existe prueba dirigida en el candidato; la omisión es demostrable por la consulta SQL y queda incluida en la remediación. |
| Escaneo general de dependencias/infraestructura | `NOT_EXECUTED` | No hubo cambios en esas superficies y el diff no lo justifica. |

## Controles no aplicables

- Secretos/configuración local: no cambiados y no aparecen en los 13 archivos.
- Datos personales: no se añaden nombres, email, login ni payloads al nuevo
  registro de auditoría.
- WebSocket, cache/Redis, mensajería, archivos, geolocalización y almacenamiento
  local: fuera de la superficie del diff.
- SCA/escaneo de infraestructura: sin dependencias ni manifiestos modificados.

## Riesgos residuales

- La migración V7 no fue aplicada contra PostgreSQL real en el entorno local;
  debe ejecutarse en CI/Testcontainers antes del gate final.
- `ResourceAccessAuthorizer` está cableado como bean pero actualmente no tiene
  consumidores de producción. Cada futuro caso de uso con recurso debe invocarlo
  (o aplicar una política equivalente) antes de leer o mutar datos; la regla
  `.anyRequest().authenticated()` no constituye autorización por objeto.
- `ResourceAccessGrantQuery` permanece cableado aunque los grants no participan
  en la política actual. Cualquier activación futura debe conservar tenant,
  propiedad de vendedor y equipo vigente de supervisor como límites no
  ampliables.
- `resourceType` es una cadena interna no vacía; mantenerla como catálogo
  controlado evita crecimiento o contenido inesperado en auditoría.

## Lecturas excepcionales

Ninguna. Se usaron el paquete v3, el handoff QA de revalidación, el diff fijado y
las dependencias directas de código/datos necesarias para reproducir el riesgo.
No se releyeron la HU, contratos, ADR ni fuentes primarias registradas en el
paquete.
