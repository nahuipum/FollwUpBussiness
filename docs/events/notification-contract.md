# Contratos de notificación EN-017

**Estado:** Aceptado para diseño; no implementado
**Versiones:** `route-notification/v1`, `notification-device/v1`
**Autoridad:** ADR-017 y decisiones EN-017 D1--D8

## Límite

Este documento es transporte-neutral. No define endpoints, SDK, proveedor,
tabla ni broker concreto. `notifications` recibe contratos por puertos/eventos
versionados; no consulta persistencia interna de otros dominios. El backend es
la autoridad de identidad, tenant y autorización por recurso.

## Envelope `route.*`

Todo evento `route.*` registrado en `event-catalog.yaml` usa:

```json
{
  "schemaVersion": "route-notification/v1",
  "eventId": "uuid",
  "eventType": "route.assigned",
  "version": 1,
  "occurredAt": "date-time",
  "tenantId": "uuid",
  "correlationId": "uuid",
  "causationId": "uuid",
  "payload": {
    "routeId": "uuid",
    "routeVersion": "opaque-version",
    "routeOperationalDate": "date",
    "recipientTechnicalIds": ["uuid"]
  }
}
```

Los únicos tipos v1 registrados son `route.published`, `route.assigned`,
`route.modified` y `route.reassigned`; emitir otro `route.*` está prohibido
hasta registrarlo y versionarlo en el catálogo. Su semántica es:

| Tipo | Se emite cuando | Destinatario mínimo |
|---|---|---|
| `route.published` | Una ruta se publica para su vendedor asignado. | vendedor asignado afectado |
| `route.assigned` | Se asigna una ruta a un vendedor. | vendedor asignado afectado |
| `route.modified` | Cambia una ruta publicada/asignada y su versión. | vendedor afectado por la modificación |
| `route.reassigned` | Cambia el vendedor de una ruta y su versión. | nuevo vendedor afectado |

Los tipos no sustituyen la autoridad de `routing`: este solo los crea después
de validar publicación, asignación/modificación/reasignación y autorización por
recurso. `routeOperationalDate` es la fecha operativa de la ruta y
`routeVersion` permite al destinatario detectar una copia Mobile desactualizada.
El aviso en pantalla bloqueada sigue siendo genérico; fecha, cambio y detalle
se obtienen del Backend tras autenticar y autorizar el refresh.

`eventId`, `correlationId` y `causationId` son UUID opacos. `tenantId` es
obligatorio y enlaza todo el procesamiento, outbox, dedupe, mensajes y
telemetría al mismo ámbito. `recipientTechnicalIds` solo contiene usuarios del
tenant que el productor ya determinó como destinatarios de la ruta; el
consumidor vuelve a validar que la instalación está activa y vinculada al mismo
tenant/usuario. No hay nombres, dirección, cliente, contenido visible, token
push ni enlace de identidad. Una versión incompatible exige una nueva versión
de contrato y adaptador/migración coordinados; `v1` solo admite campos
opcionales aditivos.

El productor futuro persiste el envelope en outbox con la misma transacción de
la transición de ruta correspondiente. Solo `routing` puede publicarlo. Antes
de reservar entrega se validan productor, tipo, `schemaVersion`, versión,
adelanto máximo de `occurredAt` configurado por ambiente y, mediante puerto
público de `routing`, tenant, destinatario, ruta y versión autorizados. Un
envelope inválido/no registrado no se entrega. La dedupe
`tenantId + eventId + recipientTechnicalId + notificationType` y estado de
entrega se escriben atómicamente; repetidos no invocan otra entrega. La TTL de
push es 24 horas desde `occurredAt`.

## Registro de dispositivo `notification-device/v1`

`notification-device/v1` no define un endpoint adicional ni añade un envelope
al JSON. Su representación canónica es `POST /devices` con el esquema
`RegisterDeviceRequest` de OpenAPI; por `additionalProperties: false`, ningún
campo no listado, incluido `schemaVersion`, es admisible:

```json
{
  "installationId": "uuid",
  "platform": "ANDROID|IOS",
  "pushToken": "protected-channel-token",
  "appVersion": "string-required",
  "deviceModel": "string-optional"
}
```

`tenantId` y `userId` no son entrada: el servidor los deriva de la sesión
activa. `installationId` es estable por instalación y se usa para upsert
idempotente; un token distinto rota el token protegido. `Idempotency-Key` tiene
alcance `tenant derivado + user derivado + operación + clave + fingerprint del
cuerpo`: igual guarda retorna el resultado original y misma clave con
fingerprint distinto da conflicto neutral sin mutación. Una clave nueva sobre
la misma instalación es el upsert/rotación. Un token se
almacena cifrado o en mecanismo de secretos equivalente, con digest técnico
para dedupe, y jamás se devuelve. El resultado público (`201` para alta o
upsert) solo confirma estado técnico sin eco de token, tenant o usuario.

`DELETE /devices/{deviceId}` resuelve atómicamente
`tenant derivado + user derivado + deviceId` y responde `204` con tiempo y
resultado indistinguibles para propio, ajeno, revocado o inexistente. Para rol
válido no hay `403/404` por pertenencia del dispositivo. Revocar por cierre de sesión,
revocación de sesión/cuenta, cambio de tenant o usuario, o baja explícita debe
impedir inmediatamente que esa vinculación sea elegida. La instalación no
concede identidad, sesión, tenant ni permisos.

Al registrar/rotar, el servidor conserva un enlace técnico con la familia de
sesión MOBILE derivada, no con secretos de credencial. En el logout MOBILE
offline, la aplicación primero detiene tracking y borra access/refresh; conserva
solo el ticket opaco de ADR-008. Al reconectar lo presenta exclusivamente a
`POST /auth/logout`. `identityaccess` resuelve el ticket y usa
`RevokeInstallationsForSession(sessionFamilyId, tenantScope)` para revocar las
instalaciones ligadas antes de completar el `204`. El puerto recibe IDs técnicos
derivados, nunca el ticket, access/refresh ni token push; repetir el logout es
idempotente. Así Mobile no inventa una llamada autenticada a `/devices` cuando
ya no posee credenciales.

El digest protegido de token push tiene un binding activo único por
adaptador/proveedor lógico y ambiente. Upsert/rotación sustituye el binding
atómicamente y conflicto no revela dueño; token inválido/no registrado informado
por el adaptador lo revoca de inmediato. Antes de enviar se revalidan
atómicamente instalación, familia, usuario y tenant activos/coincidentes.

## Entrega y contenido

`notifications` expone puertos de aplicación para: solicitar email de
identidad, consumir evento de ruta, registrar/rotar instalación y revocar
vinculaciones. Adaptadores de email transaccional y push se seleccionan por
configuración de ambiente y no filtran sus SDK al dominio.

Para identidad, `IdentityNotificationPort` acepta trabajo durable cifrado, de
acceso mínimo, con referencia técnica de acción, propósito y `expiresAt` no
posterior al token. La emisión más reciente por tenant+cuenta+propósito aplica
latest-wins atómico; dedupe y backoff+jitter no superan `expiresAt`; al resolver
se hace crypto-erase. Presupuesto/alertas son globales por adaptador/proveedor
lógico y ambiente, y la respuesta pública permanece neutral.

La push de ruta es best-effort: reintentos transitorios con backoff+jitter
acotados, después DLQ y alerta. Cuota o dependencia degradada no activan
email/SMS de ruta; Mobile refresca desde Backend al abrir/reconectar. Email
transaccional es exclusivo para identidad. Toda notificación apta para pantalla
bloqueada tiene título y cuerpo genéricos y ningún dato de negocio, identidad o
identificador.

## Seguridad y observabilidad

Se prohíben token push, contenido, token/enlace de acción, correo y payload
completo en logs, auditoría y métricas. Se permiten tipo, resultado, intento,
adapterId, latencia, `correlationId` e IDs técnicos protegidos. Las alertas
cubren cuotas, DLQ, errores sostenidos, latencia y revocaciones/rotaciones
fallidas. Secretos y configuración por ambiente siguen ADR-010; sandbox es un
ambiente separado y no contiene credenciales versionadas.
