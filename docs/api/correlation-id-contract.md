# Contrato de Correlation ID E2E

**Estado:** `READY_FOR_HANDOFF`
**Alcance:** toda operación REST, outbox/eventos, consumidores, logs y UI.

## Política pública única

El header de entrada y salida es exactamente `X-Correlation-Id`. Los nombres de
headers HTTP se comparan sin distinguir mayúsculas/minúsculas; el servidor emite
siempre la grafía canónica anterior. Se admite como valor únicamente un UUID v4
RFC 4122 en minúsculas, de 36 caracteres:
`018f4e22-7f40-4b9a-a8f9-5e9a3d7b1c20`. No se recorta, normaliza ni decodifica.

| Entrada `X-Correlation-Id` | Comportamiento | Salida HTTP |
|---|---|---|
| Ausente | Genera UUID v4 criptográficamente seguro una vez al inicio. | Éxito/error con ese ID en header; en problema también `correlationId`. |
| Un único UUID v4 canónico | Lo preserva exactamente como ID efectivo. | Éxito/error con el mismo ID. |
| Vacío, espacios, UUID no v4/no canónico, caracteres no permitidos o longitud distinta de 36 | Rechaza antes de autenticación, autorización y lógica de negocio; genera un UUID v4 nuevo sólo para trazar el rechazo. | `400 application/problem+json`, `code: CORRELATION_ID_INVALID`, header y body con el UUID nuevo. |
| Más de una ocurrencia del header | Igual al caso inválido; no selecciona una ocurrencia. | `400 CORRELATION_ID_INVALID` con UUID nuevo. |

Ejemplos: ausente genera `018f4e22-7f40-4b9a-a8f9-5e9a3d7b1c20`; vacío (`X-Correlation-Id:`), `ABC`, `018F4E22-7F40-4B9A-A8F9-5E9A3D7B1C20` o un valor de 37 caracteres reciben el mismo `400` neutral. Un éxito con el valor válido anterior responde `X-Correlation-Id: 018f4e22-7f40-4b9a-a8f9-5e9a3d7b1c20`. Un error de negocio conserva ese mismo header y el cuerpo incluye `"correlationId":"018f4e22-7f40-4b9a-a8f9-5e9a3d7b1c20"`. OpenAPI enlaza el parámetro en sus 94 operaciones; cada una declara `400`, ya sea con `CorrelationIdInvalid` o con una respuesta 400 cuyo `x-error-codes` incluye el mismo código.

El payload estable del rechazo es `application/problem+json` conforme a
`ErrorResponse`: `status: 400`, `code: CORRELATION_ID_INVALID`, `title` y
`detail` neutros que no repiten el valor recibido, y el `correlationId` nuevo.
No se informan longitud, carácter ni ocurrencia inválidos.

## Propagación y seguridad

El ID efectivo se fija una sola vez por solicitud y se reutiliza en respuesta,
errores, auditoría/log estructurado y envelope outbox. Cada evento conserva el
ID; consumidores y sus reintentos/DLQ lo conservan; eventos derivados mantienen
el mismo `correlationId` y usan como `causationId` el `eventId` padre. Operaciones
asíncronas iniciadas sin HTTP generan un UUID v4 una vez al crear su comando.

Cada solicitud concurrente recibe además un `executionId` UUID v4 generado por
servidor, sólo interno. Una repetición deliberada de un ID por clientes distintos
no fusiona trazas ni autoriza datos: autenticación, tenant, recurso e
idempotencia se validan por sus controles propios. Los logs/auditoría indexan
`correlationId`, `executionId` y tenant técnico; toda consulta de observabilidad
requiere autorización y scope de tenant/plataforma antes de devolver resultados.
El ID no se usa como clave de cache, búsqueda de recursos, autorización ni
partición de tenant.

En HTTP público, `traceparent` no es confiable: el gateway crea una raíz interna
nueva, no registra ni reemite el valor ni permite que sus `trace-flags` impongan
muestreo. Sólo llamadas de servicios autenticados en el canal interno pueden
aportar un `traceparent` W3C válido; se valida su sintaxis, se aplica la política
de muestreo local y se mantiene su relación únicamente dentro de ese perímetro.
En ningún caso sustituye, deriva ni se devuelve como `correlationId`.

Logs, métricas y telemetría registran sólo el UUID validado/generado junto con
operación, resultado, latencia y tipo de error. Nunca registran el header
rechazado, payload, credenciales, cookies, tokens, PII, coordenadas ni
`traceparent`. Los sinks sólo aceptan el UUID validado/generado; no interpolan
texto de cliente, evitando inyección de logs.

La UI lee `X-Correlation-Id` expuesto por CORS y lo prefiere al cuerpo de
problema. Muestra y permite copiar sólo el UUID contractual de la respuesta
vigente; no persiste IDs entre sesión/empresa, ni muestra respuestas obsoletas.
No genera autoridad ni revela información adicional.

## Matriz criterio → prueba

| Criterio INT-028 | Prueba objetiva |
|---|---|
| Entrada y preservación | Solicitud con UUID v4 canónico: mismo header en éxito, problema, auditoría y outbox. |
| Ausente y rechazo | Ausente genera UUID v4; vacío, duplicado, mayúsculas, no UUID y 37 caracteres devuelven `400 CORRELATION_ID_INVALID`, UUID nuevo y cero escrituras/eventos. |
| Propagación | HTTP aceptado → envelope/outbox → consumidor → evento derivado/DLQ → log: mismo ID; `causationId` del derivado es el evento padre. |
| UI | CORS expone header; UI muestra/copia el UUID de la respuesta vigente, no `detail`, y lo limpia al cambio de sesión/empresa u obsolescencia. |
| Concurrencia y A/B | Dos solicitudes y dos tenants en paralelo, incluso con el mismo `correlationId` y `traceparent`, conservan `executionId` y evidencias propias; las consultas autorizadas por scope no mezclan resultados. |
| Datos e inyección | Valores hostiles no se reflejan ni llegan a logs; escaneo de respuesta/evento/log confirma ausencia de secretos, tokens, PII, cookies, coordenadas y `traceparent`. |
