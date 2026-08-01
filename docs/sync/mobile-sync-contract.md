# Contrato `mobile-sync/v1`

**Versión:** `1.0.0`
**Estado:** Aceptado
**Fuente:** EN-015; no representa endpoints implementados.

## Aceptación

- **Decisión:** A — contrato estable de EN-015 junto con ADR-015.
- **Responsable humano de Arquitectura:** Luis Siancas — Owner.
- **Fecha de aceptación:** 2026-07-31 (America/Lima).
- **Confirmaciones técnicas:** Mobile, Backend y QA Mobile `PASS`; referencias en `docs/handoffs/governance/EN-015-acceptance.md`.
- **Límite:** el contrato sigue siendo transporte-neutral; INT-015 e INT-018 deben publicar sus rutas y payloads compatibles antes de habilitar productores.

## Alcance y envelope

El contrato es transporte-neutral hasta que INT-015/INT-018 publiquen las rutas
backend. Mobile persiste este envelope antes de cualquier envío:

```json
{
  "clientGeneratedId": "uuid",
  "idempotencyKey": "uuid",
  "deviceId": "uuid",
  "tenantId": "tenant-id",
  "ownerUserId": "user-id",
  "aggregateType": "visit|sale",
  "aggregateId": "uuid",
  "commandType": "visit.check-in|visit.check-out|sale.create",
  "sequenceNumber": 1,
  "dependsOn": ["uuid"],
  "schemaVersion": "mobile-sync/v1",
  "createdAtDevice": "2026-07-31T14:30:00-05:00",
  "timezone": "America/Lima",
  "correlationId": "uuid",
  "causationId": "uuid",
  "payload": {}
}
```

`clientGeneratedId`, `idempotencyKey`, `correlationId` y `causationId` son UUID
opacos; `clientGeneratedId` e `idempotencyKey` permanecen iguales durante todos
los reintentos. `payload` conserva fecha/hora y coordenadas originales cuando
el comando las contiene; el servidor agrega su fecha de recepción.

## Estados y transiciones

| Estado | Entrada | Salida/acción |
|---|---|---|
| `pending` | comando durable o `syncing` recuperado | `syncing` cuando se reserva para envío |
| `syncing` | worker toma el comando | `synced`, `error`, `conflict` o `pending` tras cierre sin acuse |
| `synced` | confirmación positiva del servidor | terminal; conservar referencia y auditoría mínima |
| `error` | fallo transitorio agotado o definitivo | reintento solo si política lo permite; definitivo requiere acción |
| `conflict` | rechazo por versión/estado incompatible | terminal automático; resolución explícita crea nuevo comando |

No se elimina un comando antes de confirmación o resolución autorizada. Un
`syncing` sin respuesta no implica éxito.

## Respuesta normalizada esperada

```json
{
  "schemaVersion": "mobile-sync/v1",
  "clientGeneratedId": "uuid",
  "status": "synced|retryable_error|permanent_error|conflict",
  "serverReference": "opaque-reference",
  "serverReceivedAt": "date-time",
  "errorCode": "stable-code",
  "retryAfterSeconds": 30,
  "remoteVersion": "opaque-version",
  "correlationId": "uuid"
}
```

`serverReference`, `remoteVersion` y `errorCode` no contienen PII. El backend
debe devolver la misma respuesta lógica para una repetición idempotente y la
referencia previamente creada para un duplicado.

## Orden, dependencias y concurrencia

El orden es FIFO por tenant, propietario y agregado. `dependsOn` debe estar en
`synced` antes de liberar el comando dependiente; agregados distintos pueden
procesarse en paralelo con límite, nunca dos comandos del mismo agregado.

## Política de errores

- Reintentable: red, timeout, 5xx y rate limit elegible; backoff exponencial con
  jitter, máximo 8 intentos, luego `error` definitivo y alerta.
- Definitivo: regla 4xx, esquema incompatible, sesión revocada y conflicto;
  pausa el comando/cola según corresponda y exige acción explícita.
- Token vencido: pausar, ejecutar refresh conforme EN-013 y reanudar solo con
  sesión válida. Token revocado: cerrar el ámbito y no reintentar.

## Aislamiento, ciclo de vida y privacidad

`tenantId` y `ownerUserId` son obligatorios en base, caché y cola; se rechaza
cualquier contexto cruzado. Logout, cambio de usuario/tenant y reinstalación
invalidan clave y eliminan el ámbito local tras tratar pendientes mediante flujo
autorizado. Sin espacio, no se descartan datos: se detiene captura sensible y se
informa. Cache no esencial puede podarse; visitas, ventas y comandos pendientes
se conservan.

No registrar tokens, documentos ni coordenadas completas. Observabilidad usa
`correlationId`, operación, resultado y tipo de error, sin payloads completos.

## Comandos definidos por este contrato

`visit.check-in` requiere sesión válida, jornada activa, cliente autorizado,
ubicación reciente y no tener otra visita activa. `visit.check-out` requiere
visita activa, resultado y comentarios cuando la regla lo exija. `sale.create`
requiere cliente, visita por defecto, importes válidos y productos activos
cuando exista catálogo. La autoridad final es backend; estas precondiciones no
crean endpoints.

## Compatibilidad

`1.0.x` admite campos opcionales aditivos. Campos obligatorios, semántica de
estados o códigos incompatibles requieren `2.0.0`, adaptador y migración
documentados. Los productores rechazan versiones no soportadas sin borrar el
comando.
