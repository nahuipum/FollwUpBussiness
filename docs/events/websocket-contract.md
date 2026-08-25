# Contrato WebSocket `tracking/v1`

**Estado:** `READY_FOR_HANDOFF` documental. Productores futuros BE-029/030/031; consumidor FE-020; validación INT-011. No implementa transporte, Redis ni clientes.

## Perfil y autenticación

Canal WebSocket nativo de frames JSON, sin STOMP, en `/ws/tracking/v1`. La credencial del upgrade es un ticket opaco, aleatorio, de un uso, emitido por `POST /auth/websocket-tickets` para un access JWT RS256 vigente de ADR-008. Dura como máximo 60 s y nunca después del `exp` del access (`min(now+60 s, access.exp)`); se entrega solo en `Sec-WebSocket-Protocol` como `tracking.v1, ws-ticket.<valor>`; nunca URL, payload, cookie, log, auditoría ni métrica. El servidor responde solo `tracking.v1`. El ticket no renueva sesión ni concede tenant, rol o recurso: los deriva en servidor.

El upgrade valida firma, `exp`, familia, cuenta y empresa activas; falla cerrado con `4401 AUTHENTICATION_FAILED`, sin detalle, datos ni publicación. La conexión queda vinculada a `access.exp`: el servidor cierra `4401 TRACKING_ACCESS_EXPIRED` a más tardar en ese instante y cancela frames/snapshots en carrera. Al expirar access o ticket, el cliente renueva por ADR-008, solicita otro ticket y abre nueva conexión. En web se crea con `new WebSocket(url, ['tracking.v1', 'ws-ticket.<valor>'])` y se acepta únicamente el protocolo negociado `tracking.v1`. `SELLER` no recibe ticket para este canal ni puede suscribirse/publicar.

## Destino y autorización

Único mensaje cliente permitido:

```json
{"type":"tracking.subscribe","version":1,"correlationId":"uuid","supervisorId":"uuid-opcional"}
```

Único destino lógico servidor→cliente: `tracking/v1/active-sellers`; nunca incorpora tenant, vendedor o supervisor. El servidor deriva tenant, rol y equipo antes de suscribir, publicar o producir snapshot REST.

| Actor | Operación/destino | Alcance | Denegación |
|---|---|---|---|
| COMPANY_ADMIN | `tracking.subscribe` → `tracking/v1/active-sellers` | vendedores del tenant; `supervisorId` opcional del mismo tenant | `4403 TRACKING_FORBIDDEN`; sin snapshot, frame ni estado parcial |
| SUPERVISOR | igual | solo equipo vigente; `supervisorId` ausente o su propia identidad | igual; sin equipo: suscripción válida y snapshot vacío |
| SELLER | ticket, suscripción o publicación | ninguno | `4403 TRACKING_FORBIDDEN`; sin presencia ni metadatos |
| cualquiera | topic guessing, `sellerId`, `tenantId`, `supervisorId` ajeno o payload extra | ninguno | `4403 TRACKING_FORBIDDEN` o `4400 TRACKING_PROTOCOL_INVALID`; sin publicación |

La autenticación no sustituye estas verificaciones. Nadie selecciona, sustituye, infiere ni restaura tenant. `sellerId` nunca es entrada de suscripción; `supervisorId` no amplía al SUPERVISOR.

## Envelope servidor→cliente

Solo una ubicación aceptada, de jornada activa y autorizada puede emitir `seller.location.updated`; rechazo/degradación nunca llevan coordenadas ni usan este tipo.

```json
{"messageId":"uuid","type":"seller.location.updated","version":1,"correlationId":"uuid","sequence":45,"payload":{"sellerId":"uuid","journeyId":"uuid","capturedAt":"date-time","receivedAt":"date-time","location":{"latitude":-12.0,"longitude":-77.0},"accuracyMeters":20,"integrityStatus":"DECLARED_NOT_MOCKED","stale":false}}
```

No contiene `tenantId`, credenciales, cookies, tokens, correo, nombre u otra PII innecesaria. Un cambio incompatible exige versión nueva y soporte paralelo explícito. `sequence` crece por `(tenant derivado, sellerId, journeyId)`; `messageId` es único. `correlationId` se propaga cuando existe.

## Frescura, orden y fallback

**Decisión MVP 2026-08-25:** servidor calcula `stale` como `receivedAt + 5 min <= now`; se refleja en snapshot REST y eventos posteriores, nunca lo define el cliente. Reutiliza el máximo de antigüedad de ADR-016 sin confundir validez de captura con frescura de entrega. Redis TTL (máximo 15 min) no define actualidad ni es fuente de verdad.

Cliente ignora `messageId` duplicado y secuencia menor/igual; ante salto pausa ese vendedor y consulta `GET /tracking/active-sellers`, misma autorización y última ubicación con `stale`. Reconexión: backoff exponencial con jitter; autenticar, suscribir y obtener snapshot antes de aplicar frames. Si WS falla o cierra `1011 TRACKING_UNAVAILABLE`, usa el mismo GET autorizado y marca degradación. Un `403` REST o cierre de autorización limpia cache y no reintenta hasta sesión válida.

## Revocación y observabilidad

Logout, expiración/revocación de familia, bloqueo/inactivación, suspensión de empresa, cambio de tenant, rol/equipo, cierre de jornada o permiso cierran con `4403 TRACKING_ACCESS_REVOKED` (o `4401` si sesión inválida), cancelan entregas en carrera y fuerzan borrar cache. Reconectar no restaura suscripciones, caché ni tenant previo: exige ticket, upgrade y autorización nuevos.

Auditar sanitizadamente upgrade, suscripción, denegación y revocación con operación, resultado, instante y `correlationId` cuando exista. Métricas: conexiones, suscripciones, rechazos, reconexiones y degradación por código/versión; jamás tenant, usuario, vendedor, coordenadas, ticket o token como labels. Errores/cierres/logs no contienen frames, coordenadas ni identificadores de recurso.

## Matriz criterio → prueba de contrato/aislamiento

| Criterio EN-020 | Prueba mínima |
|---|---|
| CA1 | ticket inválido/expirado→4401; reloj controlado confirma cero frames/snapshot después de `access.exp`; caída→GET autorizado y degradación |
| CA2 | A intenta tenant/topic/seller de B y B→A; sin frame, snapshot ni metadato |
| CA3 | admin A solo A; supervisor A solo equipo vigente; sin equipo→vacío |
| CA4 | esquema v1 sin tenant/secretos; timestamps, `stale`, secuencia y correlationId |
| CA5 | revocación no restaura; duplicado, fuera de orden y salto |
| CA6 | BE/FE validan matriz; INT-011 conserva A→B/B→A |

La estrategia A→B/B→A usa dos tenants, admin/supervisor por tenant, vendedores propios/ajenos y supervisor sin equipo. En ambas direcciones intenta upgrade, suscripción, IDs manipulados, publicación y fallback; exige ausencia de coordenadas, presencia, ID y metadato temporal ajenos, incluidos logs/auditoría/métricas.
