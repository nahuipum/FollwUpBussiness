# ADR-021 — Auditoría transaccional de autenticación anónima

**Estado:** Aceptado
**Aprobado por:** Usuario — continuación de BE-004, 2026-08-04 (America/Lima)
**Dominios:** `identityaccess` (productor) y `audit` (propietario de auditoría)

## Contexto

BE-004 debe renovar una sesión mediante un endpoint deliberadamente anónimo: el
contexto confiable de cuenta, tenant, familia y canal solo existe tras resolver
el digest del refresh en PostgreSQL. ADR-008 exige auditar el refresh exitoso,
rotado y reutilizado, y ADR-020 exige que una mutación crítica y su auditoría
confirmen o reviertan juntas.

El puerto existente `RecordAuditEntryUseCase` obtiene tenant, actor y
correlationId de `SecurityContext`; por diseño no sirve a un refresh anónimo.
`identityaccess` no puede acceder a tablas ni adaptadores internos de `audit`.

## Decisión

`audit` expondrá un puerto de aplicación público y específico para resultados
de autenticación anónima, por ejemplo `RecordAuthenticationAuditUseCase`. Su
comando acepta exclusivamente valores técnicos ya derivados por
`identityaccess` de una familia persistida:

- `accountId`, `sessionFamilyId`, `tenantId` nullable solo para plataforma;
- `correlationId` validado/saneado por servidor;
- canal persistido `WEB|MOBILE` y resultado de vocabulario cerrado;
- momento de servidor y, cuando aplique, razón técnica saneada.

El comando no admite refresh, JWT, CSRF, cookie, digest, cabeceras, IP,
user-agent, payload HTTP, tenant/rol declarados por el cliente ni PII.
`audit` valida la coherencia mínima, asigna la acción `AUTHENTICATION` y el
recurso técnico `SESSION_FAMILY`, y persiste por su propio adaptador.

La escritura de ese puerto usa el mismo `DataSource` y
`PlatformTransactionManager` de PostgreSQL que la rotación de `identityaccess`.
El caso de uso de refresh abre una única transacción que consume/crea el token,
revoca cuando corresponde y registra la auditoría crítica antes de emitir
credenciales. Si cualquiera falla, revierte todo. La identidad de purga sigue
separada; el rol de aplicación conserva sobre `audit_entry` únicamente los
privilegios `INSERT`/`SELECT` exigidos por ADR-020.

El cruce entre dominios queda limitado a ese puerto público. No se permite que
`identityaccess` importe `audit.adapter..`, escriba tablas de `audit` ni
duplique su política de retención. Logs y métricas en `identityaccess` son
observabilidad secundaria saneada y no sustituyen la entrada append-only.

## Alternativas

1. **Escribir `audit_entry` desde `identityaccess`:** descartada; rompe la
   propiedad del dominio y sus controles de retención/privilegios.
2. **Registrar solo logs o métricas:** descartada; no satisface auditoría
   durable ni atomicidad de la mutación crítica.
3. **Adaptar el `SecurityContext` para un refresh anónimo:** descartada; haría
   pasar por autenticado un flujo que aún no lo está y permitiría autoridad
   artificial.
4. **Auditoría asíncrona/outbox:** descartada para este registro crítico; no
   garantiza reversión conjunta si falla la auditoría.

## Consecuencias

- `audit` amplía su contrato público y vocabularios con pruebas de validación y
  ausencia de secretos.
- La configuración de escritura de auditoría crítica debe participar en la
  transacción primaria; se conserva la separación del purgador.
- BE-004 puede verificar `SEC-BE004-09` y `SEC-BE004-10` sin acceso interno
  entre dominios.
- Otros flujos anónimos pueden usar el puerto solo cuando satisfagan el mismo
  modelo de contexto técnico derivado; no es un comando genérico de auditoría.

## Riesgos

- Una configuración que use un `DataSource` distinto para la escritura crítica
  pierde atomicidad; debe fallar al arrancar o estar cubierta por prueba de
  rollback.
- El vocabulario debe mantenerse cerrado para evitar motivos o etiquetas que
  introduzcan secretos/PII.
- El `tenantId` nullable solo corresponde a cuentas de plataforma y se valida
  contra la familia persistida.

## Reversión

No se vuelve a acceso directo ni a auditoría asíncrona para refresh. Si el
puerto presenta un defecto, se deshabilita `/auth/refresh`, se corrige con una
migración/cambio forward-compatible y se conserva la auditoría ya escrita.
