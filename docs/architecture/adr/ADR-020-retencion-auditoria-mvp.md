# ADR-020 — Retención e integridad de auditoría para el MVP

**Estado:** Aceptado

**Fecha:** 2026-08-04

**Historia:** BE-051, BE-052 e INT-025

## Contexto

BE-051 exige registros de acciones críticas con empresa, actor, acción,
recurso, fecha, correlación y valores anterior/nuevo permitidos. También exige
inmutabilidad y retención. La política de ubicaciones de ADR-016 no aplica a
estos registros y declaraba pendiente la política específica de auditoría.

El MVP es un SaaS multiempresa: PostgreSQL es la fuente de verdad, el tenant
se deriva de la sesión y ninguna consulta puede cruzar tenant. La auditoría
debe ser útil para investigar cambios sin conservar secretos, payloads
completos ni datos personales innecesarios. Esta es una decisión operativa del
MVP; Producto y Legal deberán revisarla antes de cualquier requisito sectorial
o territorial distinto.

## Decisión

### D1 — Alcance, minimización y clasificación

Cada `audit_entry` append-only contiene únicamente:

- `id`, `tenant_id`, `occurred_at` UTC generado por servidor;
- actor técnico (`actor_id` o `SYSTEM`), acción controlada, resultado y tipo e
  identificador del recurso;
- `correlation_id`, ámbito técnico mínimo y motivo opcional saneado;
- representaciones `before` y `after` limitadas a una lista permitida por
  acción, sin contraseñas, tokens, documentos completos, coordenadas
  innecesarias ni payload HTTP completo.

No se persisten nombre visible, correo, teléfono, dirección, user-agent
completo, cabeceras de autenticación ni identificadores de dispositivo en la
entrada general. El identificador técnico estable permite investigar sin
duplicar datos personales.

La dirección IP solo se guarda cuando es necesaria para investigación de
autenticación, cambios de privilegio o soporte excepcional autorizado. Se
guarda en `audit_network_context`, tabla separada y de acceso más restrictivo;
no se expone por `GET /audit-entries`, no se replica a eventos y no forma parte
de `before`/`after`.

### D2 — Inmutabilidad y autorización

`audit_entry` es append-only: la aplicación no expone operaciones de
actualización ni eliminación ordinaria, y el rol de ejecución de la aplicación
solo recibe privilegio `INSERT` y `SELECT` sobre la tabla. Las únicas
eliminaciones físicas las ejecuta un rol de mantenimiento separado mediante el
job definido en D4.

Las entradas nunca tienen una clave foránea que fuerce la eliminación cuando
una entidad de negocio se borra lógicamente. Las consultas siempre filtran por
`tenant_id`; el tenant procede del contexto autenticado y el rol mínimo no
sustituye la autorización sobre el recurso o ámbito solicitado.

Los intentos permitidos, denegados y fallidos de acciones críticas registran
actor técnico, acción, resultado, recurso/alcance y `correlationId`. Un fallo
de persistencia de la auditoría para una mutación crítica revierte la mutación
en la misma transacción; los fallos de observabilidad secundaria no incorporan
payload sensible al log.

### D3 — Plazos de retención del MVP

| Dato | Retención | Inicio del cómputo | Fin de vida |
|---|---:|---|---|
| `audit_entry` y sus representaciones saneadas | 365 días | `occurred_at` UTC | Purga física por D4 |
| `audit_network_context` | 90 días | `occurred_at` UTC | Purga física separada por D4 |
| Métricas y logs operativos saneados | 30 días | emisión | Rotación del sistema de observabilidad |
| Copias de recuperación | máximo 30 días | creación de copia | Destrucción automática; restauración en cuarentena |

No existe retención indefinida ni retención por defecto superior a estos
plazos. Una investigación que necesite conservar evidencia más allá del plazo
requiere una orden de conservación aprobada por Legal y Seguridad antes del
vencimiento. Dicha orden registra solo `caseId`, rango temporal, tenant,
alcance, aprobadores, fecha de expiración y `correlationId`; no copia entradas
ni material sensible. Al expirar, el job vuelve a aplicar D4. Esta excepción
no se implementa en BE-051; su contrato y autorización deben aprobarse antes
de habilitarla.

### D4 — Purga, concurrencia, copias y evidencia de operación

Un job diario e idempotente purga primero `audit_network_context` vencido y
luego `audit_entry` vencido. Procesa lotes de como máximo 500 filas ordenadas
por vencimiento, usa bloqueo de filas con omisión de bloqueadas o una estrategia
equivalente, confirma cada lote y conserva el predicado de vencimiento en cada
`DELETE`. La ejecución concurrente no puede borrar una fila antes del corte ni
producir un error por doble borrado.

El job publica métricas saneadas por resultado (filas purgadas, duración,
reintentos y antigüedad del último éxito) y deja una evidencia técnica de
ejecución sin identificadores de actor, recurso, IP ni valores auditados. Una
ejecución fallida alerta a Operación; las consultas nunca muestran registros
vencidos si el job está retrasado.

Las copias de recuperación son de 30 días como máximo. Una restauración entra
en cuarentena, ejecuta la misma purga antes de habilitar consultas o
publicaciones y deja evidencia saneada de ese control. Por tanto, una copia no
puede reintroducir registros vencidos en una superficie accesible.

### D5 — Índices, pruebas y evolución

La migración de BE-051 debe incluir como mínimo índices compatibles con
consultas por `tenant_id`, `occurred_at`, actor, acción y recurso, y otro para
la selección de vencimientos. Debe probarse:

- rechazo de actualización/eliminación ordinaria y escritura append-only;
- aislamiento entre tenants y autorización por recurso;
- omisión/saneamiento de campos prohibidos en `before`/`after`;
- `correlationId`, actor, acción, resultado y alcance en éxito, denegación y
  error;
- retención de 365/90 días, exclusión de vencidos y purga por lotes;
- reintento y ejecución concurrente del job sin duplicados ni borrado temprano;
- restauración en cuarentena antes de exponer datos.

Cualquier cambio de plazos, categorías de datos, excepción de conservación,
acceso a IP o mecanismo de purga requiere ADR sustituto y revisión de Seguridad
y Legal/Privacidad.

## Alternativas

1. **Retención indefinida:** descartada por minimización de datos y coste.
2. **Aplicar 90 días de ubicaciones a auditoría:** descartada; son datos y
   finalidad diferentes.
3. **Conservar la IP dentro de cada entrada 365 días:** descartada por
   exposición innecesaria; se separa y limita a 90 días cuando aplica.
4. **Permitir ediciones para corregir auditoría:** descartada; se agrega una
   nueva entrada de corrección con referencia a la anterior, nunca se altera la
   original.

## Consecuencias

- BE-051 puede implementar un modelo y una migración verificables sin asumir
  una retención implícita.
- BE-052 no expone IP ni datos de red por su endpoint general.
- INT-025 valida la purga, restauración, aislamiento y evidencia operativa.
- El rol de mantenimiento y la automatización del job son superficies de alto
  privilegio que requieren revisión de Seguridad.

## Riesgos

- El periodo de 365 días es una decisión de MVP y puede no cubrir obligaciones
  regulatorias futuras; no debe presentarse como asesoramiento legal.
- Un job detenido puede aumentar la remanencia hasta su recuperación; alertas,
  exclusión en consulta y restauración en cuarentena reducen la exposición.
- Las listas permitidas de `before`/`after` deben evolucionar junto con cada
  acción crítica para evitar que aparezcan datos sensibles por defecto.

## Reversión

No se revierte a retención indefinida. Ante un incidente se puede detener la
ingesta de nuevas acciones afectadas, mantener las entradas ya existentes y
deshabilitar temporalmente el job solo con aprobación de Seguridad y
Legal/Privacidad; al recuperarlo se procesa el atraso en lotes. Cambiar los
plazos o el modelo requiere un ADR sucesor y migración versionada.
