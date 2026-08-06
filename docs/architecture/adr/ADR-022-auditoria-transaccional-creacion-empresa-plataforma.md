# ADR-022 — Auditoría transaccional de creación de empresa de plataforma

**Estado:** Aceptado
**Aprobado por:** Usuario — decisión de BE-001, 2026-08-05 (America/Lima)
**Dominios:** `tenancy` (productor) y `audit` (propietario de auditoría)

## Contexto

BE-001 crea una empresa y su configuración inicial mediante un actor
`PLATFORM_SUPERADMIN`. Es una identidad de plataforma: no pertenece a una
empresa y tiene `tenantId = null`. La creación es una mutación crítica que debe
producir evidencia durable, saneada y atómica con el alta de empresa.

El puerto público existente de `audit` requiere un actor con tenant, su
vocabulario no representa `COMPANY` y su escritor usa un `DataSource` separado.
Por tanto, no puede registrar esta operación ni garantizar que la creación de
`tenancy_company` y la auditoría confirmen o reviertan juntas. `tenancy` no
puede acceder a tablas ni adaptadores internos de `audit`.

## Decisión

`audit` expondrá un puerto público, estrecho y específico para esta capacidad:
`RecordPlatformCompanyAuditUseCase`. No se amplía el puerto genérico con un
tenant opcional.

Su comando solo recibe:

- `resourceId` de la empresa, generado por servidor; y
- un resultado de vocabulario cerrado.

El adaptador de contexto confiable de `audit` deriva y valida en servidor el
actor, el rol exacto `PLATFORM_SUPERADMIN`, `tenantId = null`, la hora de
servidor y el `correlationId`. El comando no acepta identidad, rol, tenant,
cabeceras, payload HTTP, secreto, token, PII ni timestamps declarados por el
cliente.

La evidencia usa vocabularios cerrados: recurso `COMPANY`, acción
`CRITICAL_MUTATION` y scope `PLATFORM`. `tenantId` es nullable exclusivamente
cuando el scope es `PLATFORM`; cualquier otra combinación se rechaza. El
registro conserva solo datos auditables mínimos y saneados.

La escritura crítica de este puerto usa el mismo `DataSource` y
`PlatformTransactionManager` de PostgreSQL que `tenancy`. El caso de uso de
creación abre una única transacción para empresa, configuración y auditoría:
si cualquiera falla, todas las escrituras revierten. El purgador de auditoría
puede conservar su conexión y sus privilegios separados, pues no participa en
esa transacción crítica.

El cruce de dominios queda limitado al nuevo puerto público. `tenancy` no
importa `audit.adapter..`, no escribe tablas de auditoría y no replica las
políticas de retención.

## Alternativas

1. **Auditoría asíncrona/outbox:** descartada; no prueba rollback conjunto de
   una mutación crítica.
2. **Logs o métricas como sustituto:** descartados; no son evidencia durable ni
   satisfacen la auditoría exigida.
3. **Fabricar un tenant para el superadministrador:** descartado; falsea el
   alcance de plataforma y rompe el aislamiento multiempresa.
4. **Puerto genérico con tenant opcional:** descartado; amplía indebidamente la
   superficie de autoridad y mezcla reglas de tenant y plataforma.
5. **Acceso directo de `tenancy` a tablas/adaptadores de `audit`:** descartado;
   rompe la propiedad de dominio y los controles de privilegios/retención.

## Consecuencias

- `audit` añade un contrato público y un modelo de contexto confiable específicos
  para una operación de plataforma, con pruebas negativas de actor/rol/tenant.
- El modelo y la persistencia de auditoría distinguen explícitamente el scope
  `PLATFORM`; se requiere migración forward-compatible si la columna/restricción
  actual no permite `tenantId` nulo bajo esa condición.
- El escritor crítico comparte la transacción de `tenancy`; deben existir
  pruebas de rollback cuando falle la auditoría y cuando falle la creación.
- BE-001 puede implementar CA-04 y `SEC-BE001-05` sin acceso interno ni
  auditoría asíncrona. Los demás controles del preflight siguen vigentes.

## Riesgos

- Aceptar `tenantId` nulo fuera de `PLATFORM` permitiría contaminación de
  alcance; se evita con una invariante de dominio y restricción de persistencia.
- Un escritor conectado a otro `DataSource` pierde atomicidad; el arranque o las
  pruebas de integración deben detectarlo.
- Un recurso o resultado libre podría introducir PII o secretos; los
  vocabularios cerrados y el saneamiento siguen siendo obligatorios.

## Reversión

No se revierte a logs, outbox ni acceso directo. Si el puerto presenta un
defecto, se deshabilita la creación de empresas de plataforma, se corrige con
migración/cambio forward-compatible y se conserva la auditoría ya escrita.

## Enmienda MVP — Auditoría de denegación tenant-bound — 2026-08-05

### Contexto

`RecordPlatformCompanyAuditUseCase` representa exclusivamente una mutación de
plataforma: su contexto confiable exige `PLATFORM_SUPERADMIN`, scope
`PLATFORM` y `tenantId = null`. No puede usarse para registrar una denegación
de un principal tenant-bound sin falsear la identidad o el alcance. La prueba
que rechaza ese principal en el proveedor de contexto conserva este límite.

### Decisión

`audit` expondrá un segundo puerto público, estrecho y específico:
`RecordCompanyDenialAuditUseCase`. No se amplía el puerto de plataforma ni el
puerto genérico con tenant opcional.

El puerto registra únicamente una denegación de creación de empresa con
recurso cerrado `COMPANY`, acción cerrada `CRITICAL_MUTATION`, resultado
cerrado `DENIED` y un identificador de intento generado por el servidor. Su
comando no acepta actor, rol, tenant, scope, payload, cabeceras, token, PII ni
tiempo del cliente.

El adaptador de contexto confiable deriva del principal y la solicitud del
servidor la identidad real: actor, tenant, scope `TENANT_BOUND_DENIAL`, hora y
`correlationId`. Este scope requiere `tenantId` no nulo; `PLATFORM` mantiene el
requisito de `tenantId = null`. Cualquier combinación fuera de la matriz cerrada
se rechaza. La evidencia mínima no conserva el tenant/payload manipulados como
atributos de negocio ni suplanta una operación de plataforma.

El escritor de denegación comparte el `DataSource` y
`PlatformTransactionManager` de `tenancy`. El caso de uso expresa la denegación
como resultado transaccional: confirma exactamente una evidencia `DENIED` sin
empresa ni configuración y solo después se traduce a `403` neutral. Si falla
la auditoría, no hay mutación ni evidencia ficticia y la operación falla sin
presentarse como denegación auditada. No se usa `REQUIRES_NEW`, un segundo
gestor, auditoría asíncrona, logs como sustituto ni acceso directo entre
dominios.

### Consecuencias

- La matriz de persistencia y una migración forward-compatible deben admitir
  `TENANT_BOUND_DENIAL` solo con tenant real no nulo, preservando los scopes de
  autenticación existentes y las reglas de `PLATFORM`.
- Desarrollo y QA deben demostrar el contexto real, la ausencia de datos
  sensibles, una sola evidencia durable, cero creación/configuración y el
  comportamiento ante fallo del escritor.
- Esta enmienda cambia la superficie de auditoría/tenant; requiere un nuevo
  preflight de Seguridad antes de cualquier Desarrollo de remediación.
