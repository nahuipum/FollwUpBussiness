# Confirmación técnica Backend — EN-015 para Fase 0 de EN-017

## Estado

`PASS` — consumibilidad técnica Backend.

Esta revisión independiente no aprueba ADR-015, `mobile-sync/v1` ni la
gobernanza de EN-015; tampoco inicia EN-017, define rutas, cambia payloads ni
selecciona proveedores.

## Alcance y snapshot

- Historia: `docs/stories/enablers/EN-015-definir-persistencia-local-y-sincronizacion.md`.
- Decisión y contrato revisados: `docs/architecture/adr/ADR-015-persistencia-local-sincronizacion-mobile.md` y `docs/sync/mobile-sync-contract.md`.
- Evidencia previa: `docs/handoffs/mobile/EN-015-qa.md`,
  `docs/handoffs/governance/EN-015-dof.md`,
  `docs/handoffs/mobile/EN-015-en017-consumability-confirmation.md` y
  `docs/handoffs/governance/EN-017-phase0-dependency-validation.md`.
- Backend inspeccionado: `backend/followupbussiness/`. Es un scaffold sin
  adaptador, puerto, controlador, migración ni prueba de comandos de
  sincronización móvil.
- Worktree inicial: cambios ajenos en ADR-016 y handoffs EN-017/Mobile; no se
  alteraron. No hay delta de ADR-015, `mobile-sync/v1`, OpenAPI ni Backend.

## Confirmación Backend

| Aspecto | Evidencia | Resultado |
|---|---|---|
| Autoridad de servidor y recurso | EN-015 y `mobile-sync/v1` mantienen Backend como autoridad final; las precondiciones de visita/venta no crean endpoint. La línea base exige autorización por objeto y tenant derivado de sesión. | PASS técnico |
| Idempotencia | UUID de comando y `idempotencyKey` son estables; el duplicado devuelve la referencia previa y la misma respuesta lógica. | PASS técnico |
| Tiempo y confirmación | Se conservan fecha/zona horaria/coordenadas originales y el servidor añade recepción; `synced` exige acuse. | PASS técnico |
| Tenant y propietario | `tenantId` y `ownerUserId` son obligatorios y se rechaza contexto cruzado; Backend exige validar `tenantId` en consultas y claves. | PASS técnico |
| Versionado | `mobile-sync/v1` admite solo adiciones opcionales en 1.0.x; incompatibilidades exigen 2.0.0, adaptador y migración. | PASS técnico |
| Rutas y payloads | El contrato se declara transporte-neutral y no representa endpoints implementados. No se creó ruta, payload, migración ni productor Backend en esta revisión. | PASS técnico |

## Observación de compatibilidad futura

`docs/api/openapi.yaml` ya contiene la superficie futura
`POST /mobile/sync/commands` para INT-015/INT-018, con un lote y esquemas
`Sync*` distintos de `mobile-sync/v1`. No es un cambio de EN-015 ni existe
implementación Backend que lo consuma, por lo que no bloquea la definición
documental. Antes de implementar INT-015/INT-018, Backend, Mobile y QA deben
resolver explícitamente cuál contrato publica el transporte y cómo se adapta,
sin modificar silenciosamente `mobile-sync/v1`.

## Verificación y reproducción

- `python -m graphify query "How are mobile local persistence and synchronization implemented?" --budget 800`: no ejecutable; el `python.exe` configurado por WindowsApps devolvió acceso denegado. No se infieren relaciones del grafo.
- `rg` dirigido en `backend/followupbussiness/`: sin símbolos de sync móvil;
  no existe prueba dirigida ejecutable para este diff documental.
- `git diff --check`: PASS.

Para reproducir: inspeccionar los archivos del snapshot, confirmar la ausencia
de un adaptador Backend de sync móvil bajo `backend/followupbussiness/src`, y
ejecutar `git diff --check`.

## Riesgos y gate

La implementación futura debe cubrir autorización por recurso con tenant de
sesión, deduplicación concurrente, conservación de timestamps, conflictos,
compatibilidad de esquema y migraciones, con pruebas de contrato e integración.
El bloqueo de gobernanza permanece: ADR-015 y `mobile-sync/v1` siguen en estado
`Propuesto`; esta confirmación no sustituye la aceptación humana o un mock
estable requerida por `docs/handoffs/governance/EN-017-phase0-dependency-validation.md`.

`PASS` técnico; no es aprobación de gobernanza.
