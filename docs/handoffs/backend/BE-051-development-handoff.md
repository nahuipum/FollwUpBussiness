# BE-051 — Desarrollo Backend handoff

## Estado

`BLOCKED`

## Candidato y alcance

- Paquete aplicado: `docs/handoffs/governance/BE-051-context-package.md` v1.
- Candidato inicial: `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384`; el módulo `backend/followupbussiness` continúa sin cambios para esta historia.
- No se implementaron dominio, puertos, adaptadores, contratos ni migraciones de `audit`: hacerlo dejaría BE051-AC-04 sin una política de retención definida, implementable y verificable.

## Bloqueo

BE051-AC-04 es bloqueante. El paquete v1 indica que ADR-016 deja pendiente la política detallada de retención de auditoría. La búsqueda dirigida de una decisión posterior estable no encontró duración, mecanismo de purga ni responsable técnico aprobado:

- `docs/handoffs/qa/EN-016-qa.md`, líneas 21–36, mantiene pendiente el detalle/contador de auditoría con fecha futura.
- `docs/stories/integration/INT-025-auditoria-transversal.md`, líneas 61–78, exige política de retención antes del desarrollo y marca la retención incorrecta como riesgo.
- `docs/stories/backend/BE-052-consultar-auditoria.md`, líneas 60–77, conserva la misma precondición.

Se requiere una decisión aprobada que defina la retención de auditoría antes de reanudar esta fase. No se inventaron plazo, purga, excepción, actor ni almacenamiento alternativo.

## Matriz de criterios

| Criterio | Evidencia | Estado |
|---|---|---|
| BE051-AC-01 | Sin implementación autorizada; queda pendiente tras desbloquear AC-04. | BLOCKED |
| BE051-AC-02 | Sin implementación autorizada; no se persisten valores anteriores/nuevos. | BLOCKED |
| BE051-AC-03 | Sin implementación autorizada; no se introduce una superficie operativa mutable. | BLOCKED |
| BE051-AC-04 | Política de retención pendiente, conforme a las fuentes citadas arriba. | BLOCKED |
| BE051-SEC-01 / OBS-01 / CON-01 | Sin código nuevo: no se altera tenant, autorización, observabilidad ni idempotencia existentes. | NOT_IMPLEMENTED |

## Archivos, contratos y migraciones

- Añadido solo este handoff: `docs/handoffs/backend/BE-051-development-handoff.md`.
- Sin cambios en `backend/followupbussiness`, OpenAPI, puertos, persistencia ni migraciones Flyway.

## Verificación y reproducción

- `git diff --check`: PASS antes de crear este handoff.
- Pruebas dirigidas: no aplicables; el bloqueo precede cualquier implementación permitida y no existe diff Backend que verificar. No se ejecutó una suite que no pueda aportar evidencia al criterio bloqueado.
- Reproducir el bloqueo: desde la raíz, ejecutar `rg -n -i -C 3 'retenci[oó]n.*audit|audit.*retenci[oó]n|BE-051|auditor[ií]a.*(retenci[oó]n|purga)|retention.*audit' docs backend/followupbussiness --glob '!docs/stories/backend/BE-051-registrar-acciones-criticas.md'`; comprobar las precondiciones de INT-025 y BE-052 indicadas arriba.

## Excepción de fuentes

La única excepción fue necesaria para resolver el bloqueo explícito del paquete: búsqueda selectiva, sin releer la HU ni los contratos/ADR ya trazados.

| Motivo | Ruta / sección | SHA-256 | Resultado |
|---|---|---|---|
| Localizar una decisión posterior estable de retención de auditoría. | `docs/handoffs/qa/EN-016-qa.md`, líneas 21–36 | `e58ce1ffd64317f9f8c16b071fed8c2b820e1190902dc0e82742a92a00d4f58a` | Pendiente, sin política aprobada. |
| Confirmar dependencia de entrega. | `docs/stories/integration/INT-025-auditoria-transversal.md`, líneas 61–78 | `4177bf506875a133e4104ee3e3261695c3fe2030c32f765e08799d859ec3e197` | Exige política antes de desarrollar. |
| Confirmar consumidor inmediato. | `docs/stories/backend/BE-052-consultar-auditoria.md`, líneas 60–77 | `781797553c7d881543da08d95b6d50b5c629b8588268167fa63c34bb4894c684` | Conserva la misma precondición. |

## Riesgos

- Implementar antes de la decisión obligaría a asumir una política de datos y violaría el alcance de BE-051.
- No se introdujeron secretos, datos personales, coordenadas ni payloads de aplicación; no hay riesgo de fuga nuevo por este intento.
