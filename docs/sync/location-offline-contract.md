# Contrato `location-offline/v1`

**Estado:** contrato futuro para BE-029, MOB-009 y QA; no representa runtime
implementado. Complementa ADR-015/ADR-016 y no modifica `mobile-sync/v1`.

## Registro local y segregación

Mobile persiste cada muestra válida antes de enviarla, en almacenamiento cifrado
y segregado, con:

| Campo local | Regla |
|---|---|
| `tenantId` | obligatorio para particionar localmente; no concede autoridad al servidor |
| `ownerUserId` | vendedor propietario; obligatorio para particionar localmente; no concede autoridad |
| `journeyId` | jornada activa a la que pertenece la captura |
| `clientEventId` | UUID estable por muestra y durante todos sus reintentos |
| `capturedAt` | instante original; nunca se reemplaza por el de envío |
| `location`, `accuracyMeters` | envelope estructural seguro (coordenadas válidas y precisión 0..10000); cifrado en reposo |
| `mocked` | señal del SO si está disponible; `true` se rechaza y ausencia queda `UNKNOWN` |
| `state` | `pending`, `in_flight`, `confirmed` o `resolution_required` |
| `attemptCount`, `lastAttemptAt` | control de reintento, sin coordenadas en logs |

La validación estructural solo permite representar y transportar la muestra; no
la acepta como ubicación de negocio. Mobile puede anticipar `accuracyMeters >
50`, pero el servidor conserva la decisión por muestra y responde
`REJECTED/LOCATION_ACCURACY_EXCEEDED` sin invalidar el lote. Esa muestra puede
existir únicamente como pendiente cifrado hasta su acuse/rechazo; nunca entra en
historial, cache, Redis, WebSocket o geocerca y se limpia tras la resolución.

Una muestra fuera incluso del rango estructural no entra en la cola. Al logout
o cambio de tenant/usuario se detiene captura y se invalida el contexto. Los
pendientes no se descartan: el ámbito queda bloqueado en estado seguro hasta
confirmación o resolución autorizada; después se destruyen clave, cache y datos
del ámbito anterior.

La base, clave y cola se excluyen de backups del sistema operativo. Tras acuse o
resolución se elimina la fila y se ejecuta limpieza/compactación segura del
motor. Logout/cambio de ámbito destruye la clave segmentada cuando ya no quedan
pendientes autorizados; no se conserva una clave capaz de recuperar páginas
liberadas.

## Lote y transporte

Cada envío usa `POST /journeys/{journeyId}/locations`, un `Idempotency-Key`
estable por intento lógico y el cuerpo `LocationBatchRequest`:

- `batchId`: UUID estable al reintentar el mismo conjunto y orden;
- `deviceId`: identificador técnico de instalación;
- `samples`: de 1 a 500, ordenadas por `capturedAt` y luego
  `clientEventId`; cada muestra conserva su `clientEventId`.

El fingerprint de lote cubre el conjunto **ordenado** completo y enlaza tenant
y owner derivados, jornada, `Idempotency-Key`, `batchId` y `deviceId`. El mismo
binding/fingerprint retorna byte-semánticamente el mismo acuse. Reutilizar clave
o `batchId` con contexto, dispositivo, conjunto u orden distinto devuelve `409
LOCATION_BATCH_IDEMPOTENCY_CONFLICT` y no procesa ninguna muestra.

`tenantId` y `ownerUserId` no se envían como autoridad. El servidor deriva
tenant y usuario de la sesión autenticada, exige rol `SELLER`, valida que la
jornada y cada recurso pertenezcan a ese contexto y rechaza cruces con `403`.
Aunque un cliente agregara esos valores fuera del esquema, se rechazan por
`additionalProperties: false` y nunca cambian el contexto servidor.

## Acuse, resolución y limpieza

La respuesta repite `batchId` y retorna exactamente un `LocationResult` por
cada `clientEventId` solicitado, en el mismo orden, sin omisiones, duplicados ni
extras. Mobile aplica cada resultado independientemente:

- `ACCEPTED` o `DUPLICATE`: confirmación terminal; puede borrar físicamente la
  muestra local después de persistir el acuse.
- `REJECTED`: exige `errorCode` estable; resolución terminal de esa muestra;
  registra solo código técnico
  y elimina coordenadas locales después de mostrar/guardar la resolución
  autorizada que corresponda.
- error de transporte, `5xx`, timeout o ausencia de resultado: vuelve a
  `pending`, conserva IDs y payload, y reintenta con backoff; nunca supone éxito.
- `401/403` o contexto revocado: pausa el ámbito; no reintenta ni limpia hasta
  recuperar sesión válida o ejecutar resolución autorizada.

No se borra el lote completo por un resultado parcial. La confirmación de cada
muestra es la única base para limpiar; un `batchId` repetido recibe el mismo
resultado lógico por muestra.

Antes de limpiar, Mobile exige que `batchId`, cardinalidad, conjunto de
`clientEventId` y orden coincidan exactamente con el request. Un acuse con ID
ausente, extra, duplicado o reordenado es inválido: no limpia nada, conserva el
lote y entra en `resolution_required`.

## Idempotencia, repetición y concurrencia

La **guarda de lote siempre precede a la guarda por muestra**:

1. se valida el binding `tenant derivado + owner derivado + journeyId +
   Idempotency-Key + batchId + deviceId + fingerprint del conjunto ordenado`;
2. replay exacto del mismo binding/fingerprint devuelve el acuse original
   semánticamente idéntico, incluidos los `status` originales, sin reprocesar
   ninguna muestra ni convertir `ACCEPTED` en `DUPLICATE`;
3. binding igual con contexto, dispositivo, conjunto, contenido u orden distinto
   devuelve `409 LOCATION_BATCH_IDEMPOTENCY_CONFLICT`, sin mutación;
4. solo un lote lógico nuevo, con nueva clave/batch binding, llega a la guarda
   por muestra. Si contiene un `clientEventId` previamente `ACCEPTED` con igual
   fingerprint, esa muestra devuelve `DUPLICATE`.

El servidor usa una guarda atómica por `tenant derivado + owner derivado +
clientEventId` y un fingerprint sanitizado del contenido. La guarda contiene
IDs técnicos, fingerprint y resultado, nunca coordenadas ni historial de
ubicación.

Precedencia observable dentro de un lote lógico nuevo:

1. autenticación, tenant, propietario y jornada se validan antes de procesar;
2. mismo `clientEventId` y mismo fingerprint ya `ACCEPTED` devuelve
   `DUPLICATE`, con la referencia original;
3. mismo `clientEventId` con fingerprint distinto devuelve `REJECTED` con
   `IDEMPOTENCY_CONFLICT`, sin mutación;
4. primera muestra válida compitiendo concurrentemente: exactamente una queda
   `ACCEPTED`; las equivalentes restantes quedan `DUPLICATE`;
5. muestra inválida, incluida su repetición, queda `REJECTED` con el mismo
   código estable y nunca `DUPLICATE`, porque no crea ubicación aceptada.
6. `capturedAt` más de 2 min futuro queda
   `LOCATION_TIMESTAMP_IN_FUTURE`; el reloj cliente nunca extiende retención.
7. por ventana UTC de 60 s de `capturedAt`, tenant, owner y jornada, solo la
   primera válida queda aceptada; extras quedan `LOCATION_FREQUENCY_EXCEEDED`.
   Lotes offline con ventanas distintas siguen permitidos.
8. `mocked=true` queda `LOCATION_MOCKED`; ausente queda integridad `UNKNOWN` y
   no habilita visita geolocalizada.

Una falla estructural del request (JSON/esquema/lote fuera de 1..500) rechaza el
request completo. Una falla de negocio individual (por ejemplo precisión >50 m
o antigüedad >5 min dentro del envelope seguro) genera `REJECTED` solo para ese
`clientEventId`; las demás muestras se procesan y reciben su propio resultado.

La telemetría de rechazo se deduplica mediante la misma clave técnica y código
de error. Solo registra contador/resultado/correlationId sanitizados; no crea
historial de ubicación, no contiene coordenadas ni publica
`seller.location.updated`.

El servidor aplica además presupuesto/rate-limit por tenant+owner+jornada,
agregado entre `deviceId`; el exceso devuelve `429 LOCATION_RATE_LIMITED` con
`Retry-After`. Logs y métricas usan solo IDs técnicos, resultado y contador, sin
coordenadas ni sanciones automáticas.

## Compatibilidad

Campos opcionales aditivos mantienen `location-offline/v1`. Cambios de estados,
precedencia, claves de idempotencia o autoridad requieren nueva versión y
revisión coordinada Backend/Mobile/QA/Seguridad.
