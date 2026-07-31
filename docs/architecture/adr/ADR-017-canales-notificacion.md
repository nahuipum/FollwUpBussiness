# ADR-017 — Canales de notificación y entrega operativa

**Estado:** Aceptado
**Historia:** EN-017
**Dominio propietario:** `notifications`
**Fecha de aceptación:** 2026-07-31 (America/Lima)
**Responsable humano:** Luis Siancas — Owner

## Contexto

EN-017 necesita separar la entrega de identidad de los avisos operativos de
ruta, sin convertir un proveedor, un dispositivo ni una notificación en fuente
de verdad. ADR-008 define el flujo neutral de recuperación y activación;
ADR-015 define el ámbito cifrado de Mobile y su limpieza autorizada; ADR-005
establece outbox, reintentos y DLQ para asíncronos; ADR-010 exige secretos fuera
del repositorio y fail-fast. Las decisiones D1--D8 aprobadas para EN-017 son la
autoridad de esta decisión.

Este ADR define contratos y límites. No crea SDK, endpoint, tabla, migración,
productor, consumidor ni proveedor nominal.

## Decisión

### Límites de dominio y puertos

`identityaccess` conserva autoridad sobre cuenta, token de acción, sesión y
revocación. Solicita una entrega transaccional mediante el puerto de salida
`IdentityNotificationPort`; no conoce canal, token de dispositivo, cola ni
proveedor. El valor secreto del enlace/token solo puede cruzar ese puerto hacia
un adaptador transaccional y nunca entra en un evento general, auditoría o
telemetría.

La solicitud de identidad se materializa como trabajo durable cifrado con
acceso mínimo, referencia técnica al token de acción, propósito y `expiresAt`
no posterior a dicho token. Por tenant+cuenta+propósito, una emisión más
reciente sustituye atómicamente el trabajo pendiente (latest-wins) y la dedupe
es durable. Backoff+jitter jamás programa intento posterior a `expiresAt`;
éxito, expiración, invalidación o sustitución hacen crypto-erase. El presupuesto
es global por adaptador/proveedor lógico y ambiente, y la respuesta HTTP sigue
neutral conforme ADR-008 aunque el trabajo no se entregue.

`routing` publica el envelope versionado `route.*` de
`docs/events/notification-contract.md` en la misma unidad transaccional que la
transición de ruta correspondiente. Los tipos v1 permitidos son
`route.published`, `route.assigned`, `route.modified` y `route.reassigned`; no
se emite otro tipo hasta registrarlo/versionarlo. `notifications` lo consume idempotentemente y resuelve la
entrega push por sus propios puertos. No accede a tablas o repositorios de
`routing`, `identityaccess` ni Mobile. Para información que no esté en el
envelope se expondrá un puerto público versionado por el dominio propietario;
no se permite acceso directo a persistencia ajena.

Los adaptadores de salida son intercambiables: `TransactionalEmailGateway` y
`RoutePushGateway`. Su configuración por ambiente elige una implementación sin
nombrarla en dominio ni contrato. FCM y la pasarela APNs son detalles del
adaptador Flutter/iOS, no una dependencia de los casos de uso.

### Instalación, identidad y revocación

El registro autenticado corresponde a una instalación, no a una identidad de
sesión. `notification-device/v1` se materializa exclusivamente en el request
canónico `RegisterDeviceRequest` de `POST /devices`: `installationId`,
`platform` (`ANDROID|IOS`), `pushToken`, `appVersion` y, opcionalmente,
`deviceModel`. La versión es el nombre/semántica del contrato, no un campo del
cuerpo: como OpenAPI rechaza propiedades desconocidas, `schemaVersion` no se
envía. `tenantId` y `userId` se derivan exclusivamente de la sesión y se
persisten junto a la instalación.
El cliente no puede registrar, leer, rotar o revocar instalaciones de otro
usuario o tenant. El `installationId` no autentica ni autoriza por sí mismo.

Registrar de nuevo la misma instalación es un upsert idempotente; cambiar el
token es una rotación. La guarda de `Idempotency-Key` tiene alcance `tenantId
derivado + userId derivado + operación + clave + fingerprint del cuerpo`: misma
guarda devuelve el resultado original; misma clave con fingerprint distinto
produce conflicto neutral sin mutación. Una clave nueva permite la rotación.
El token se valida por formato/tamaño del canal y se
conserva protegido (cifrado o almacén de secretos equivalente, con digest
técnico para deduplicación); nunca aparece en respuesta, eventos, métricas,
auditoría ni logs. Cierre de sesión, revocación de sesión/cuenta, cambio de
usuario o tenant y una baja explícita revocan de inmediato la vinculación de
entrega aplicable. Una instalación revocada no es elegible aunque exista una
entrega pendiente.

`DELETE /devices/{deviceId}` resuelve atómicamente el binding `tenant derivado
+ user derivado + deviceId` y responde `204` con tratamiento temporal
indistinguible si es propio, ajeno, revocado o inexistente. No revela existencia
ni pertenencia. Autenticación y rol se validan antes; una identidad con rol
válido no recibe `403/404` por probar un `deviceId` ajeno.

El logout MOBILE pendiente de ADR-008 no llama a `DELETE /devices/{deviceId}`
ni conserva access/refresh. Al resolver el HMAC del
`X-Session-Revocation-Ticket`, `identityaccess` revoca la familia y, mediante
el puerto público `RevokeInstallationsForSession`, solicita a `notifications`
revocar inmediatamente las vinculaciones de instalación registradas/rotadas
por esa familia, usando solo `sessionFamilyId` y ámbito técnico derivados en
servidor. El ticket, refresh, access y token push no cruzan el puerto, no se
persisten en `notifications` ni se registran. Repetir el ticket o el logout no
reactiva ni reelige una instalación; el resultado público sigue siendo `204`.

### Eventos, outbox y entrega

El envelope `route.*` es la superficie estable y lleva versión, `eventId`,
`tenantId`, `correlationId`, `causationId`, instante, tipo, fecha operativa,
versión y referencia de ruta. Solo los cuatro tipos v1 registrados en el
catálogo pueden emitirse. Sus semánticas separan publicación, asignación,
modificación y reasignación, por lo que BE-053 puede notificar el cambio sin
inferirlo desde `route.published`. Los campos de
enrutamiento permiten resolver destinatarios técnicos sin datos de negocio en
la pantalla bloqueada. El cliente push no es fuente de verdad: al recibirlo o
al abrir/reconectar, Mobile consulta/refresca desde Backend con la sesión y
autorización vigentes.

El productor futuro escribe evento de negocio y outbox en una transacción; un
publicador durable reintenta la publicación. Antes de reservar entrega,
`notifications` valida productor `routing`, tipo/esquema/versión registrados,
adelanto máximo de `occurredAt` configurado por ambiente y, mediante puerto
público de `routing`, tenant, ruta, versión y destinatario autorizados. La
dedupe `tenantId + eventId + recipientTechnicalId + notificationType` y estado
de entrega se escriben atómicamente; un envelope inválido no se entrega. El
digest de token push tiene binding activo único por adaptador/proveedor lógico y
ambiente; rotación lo sustituye atómicamente y token inválido/no registrado lo
revoca de inmediato. Antes de enviar se revalidan instalación, familia, usuario
y tenant. Reintentos de fallos transitorios usan backoff exponencial
acotado y jitter; al agotarse pasan a DLQ con metadatos saneados y alerta. Las
notificaciones push vencen a las 24 horas desde `occurredAt`; vencidas no se
reintentan ni entregan. La disponibilidad del push degrada a sincronización al
abrir/reconectar: no existe fallback email/SMS para rutas. Email transaccional
es únicamente el fallback/canal de identidad.

### Privacidad, seguridad y observabilidad

La pantalla bloqueada usa exclusivamente título y cuerpo genéricos. No incluye
nombres, clientes, direcciones, ruta, identificadores, contenido de identidad,
enlaces ni datos personales. El contenido completo, si existe, se obtiene solo
tras desbloqueo, sesión válida, tenant y autorización por recurso.

Auditoría y métricas admiten tipo, resultado, intento, proveedor/adapterId,
latencia, `correlationId` e IDs técnicos protegidos. Prohíben token push,
contenido, enlace, token de acción, correo y payload completo. Las etiquetas de
métricas no usan IDs de tenant/usuario de alta cardinalidad.

### Configuración, operación y reversión

Cada ambiente configura un proveedor transaccional mediante secretos
gestionados fuera del repositorio; sandbox es un ambiente separado. La
configuración técnica versionada define límites de cuota, máximo de intentos,
backoff, TTL y umbrales de alerta. Debe alertar cuota próxima/agotada, DLQ,
errores sostenidos, latencia y fallos de rotación/revocación, sin secretos.

Ante cuota agotada o proveedor degradado se conserva el estado durable, se
aplican límites y alertas, y para rutas se depende de sincronización posterior;
no se inventa un canal alternativo. Un rollback deshabilita el adaptador o el
publicador mediante configuración/flag, detiene nuevos intentos y conserva
outbox/DLQ para disposición controlada. No reenvía mensajes vencidos ni
restaura tokens revocados. Cambiar proveedor nominal, protocolo, persistencia,
TTL o estrategia de deduplicación exige ADR sucesor y revisión de Seguridad.

## Alternativas descartadas

- Usar push para enlaces de activación o recuperación: expone secretos y mezcla
  identidad con entrega operativa.
- Permitir que Mobile declare tenant/usuario del dispositivo: rompe autoridad
  de sesión y aislamiento multiempresa.
- Usar push como estado de ruta o enviar email/SMS por cada ruta: contradice el
  comportamiento best-effort aprobado.
- Acoplar dominio a SDK o proveedor concreto: impide sustitución por ambiente y
  excede el alcance aprobado.

## Consecuencias y riesgos

Las historias implementadoras deberán añadir migraciones versionadas para la
instalación, incluido el enlace técnico a la familia de sesión para la
revocación por ticket, el estado de entrega, dedupe y outbox si no existen; ninguna
migración se autoriza aquí. BE-006 implementará solo la solicitud de identidad,
BE-053 el flujo de ruta y MOB-029 el receptor/refresh, cada uno con pruebas de
tenant, autorización, concurrencia, expiración, revocación y degradación.

Persisten riesgos de entrega duplicada por garantías al menos una vez, de token
obsoleto y de cuota/proveedor degradado. Dedupe, rotación, revocación inmediata,
TTL, DLQ y el refresh autoritativo los contienen, pero requieren validación
independiente de QA y Seguridad al implementar.

## Reversión

La reversión futura es forward-only: deshabilitar nuevos envíos, preservar
outbox/DLQ y revocar instalaciones o secretos comprometidos mediante el flujo
autorizado. No se borra ni se reutiliza un token protegido para revertir.
