# EN-020 — Definir contrato y aislamiento multiempresa WebSocket

**Área:** Arquitectura / Seguridad / Integración
**Tipo:** Enabler funcional y técnico
**Épica:** Tracking
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** equipo de producto y desarrollo
**Quiero** definir el contrato WebSocket y sus controles multiempresa
**Para** implementar el tracking en vivo sin mezclar conexiones, suscripciones
ni ubicaciones entre empresas

## Objetivo

Cerrar antes del desarrollo de tracking en vivo el contrato que deberán
implementar Backend y Frontend y validar las pruebas E2E. El cierre de este
enabler es una puerta de Ready obligatoria para `BE-029`, `BE-030`, `BE-031`,
`FE-020` e `INT-011`.

## Alcance

- Autenticación del handshake y renovación o expiración de la conexión.
- Autorización de conexión y suscripción por empresa, rol, equipo y recurso.
- Derivación del tenant desde la sesión autenticada; el cliente no puede elegir
  ni sustituir el tenant efectivo.
- Convención de destinos/topics y segregación multiempresa.
- Envelope versionado de `seller.location.updated`, con identidad de recurso,
  `capturedAt`, `receivedAt`, `stale`, secuencia y `correlationId` cuando aplique.
- Orden temporal, duplicados, replay, reconexión y fallback REST.
- Revocación por logout, suspensión, cambio de empresa o pérdida de permisos.
- Respuestas de rechazo, cierre y degradación sin coordenadas ni datos sensibles.
- Matriz actor × destino × operación y estrategia de pruebas de contrato y
  aislamiento A→B/B→A.

## Criterios de aceptación

1. El contrato define handshake, conexión, suscripción, publicación, error,
   cierre, reconexión y fallback REST con semántica pública verificable.
2. El tenant efectivo se deriva de la sesión y ninguna conexión, destino o
   payload permite seleccionar o sustituir la empresa autorizada.
3. La matriz de autorización define quién puede observar cada vendedor/equipo y
   cómo se rechazan conexión y suscripción sin emitir datos ni efectos cruzados.
4. El envelope y los destinos están versionados y conservan tenant/propiedad,
   orden temporal, `capturedAt`, `stale` y `correlationId` sin exponer ubicación
   en logs, métricas ni errores.
5. Se definen revocación, expiración, cambio de empresa, replay, duplicados,
   dependencia degradada y reconexión sin restaurar estado del tenant anterior.
6. Backend, Frontend y QA de contrato aprueban la matriz criterio → prueba y los
   escenarios A→B/B→A antes de iniciar `BE-029`.

## Referencias

- RN-001
- RN-002
- RN-016
- RF-UBI-004
- ADR-002 — Aislamiento multiempresa
- ADR-006 — WebSocket para supervisión
- EN-016 — Definir privacidad, retención y rastreo

## Seguridad y privacidad

- La autenticación de la conexión no sustituye la autorización de cada
  suscripción y recurso.
- Toda denegación define respuesta/cierre, ausencia de publicación, auditoría y
  estado de credenciales/sesiones.
- Una empresa nunca recibe presencia, identificadores, coordenadas ni metadatos
  temporales pertenecientes a otra empresa.
- Logs, métricas y errores omiten coordenadas, tokens, cookies y datos personales.
- Seguridad debe revisar BOLA, suscripción cruzada, topic guessing, replay,
  revocación y restauración de conexión.

## Observabilidad

- Propagar `correlationId` desde el evento hasta la publicación cuando aplique.
- Medir conexiones, suscripciones, reconexiones, rechazos y degradación por
  categorías seguras, sin labels con tenant, usuario o coordenadas.
- Distinguir datos actuales, `stale` y fallback REST.

## Evidencia mínima para DoF

- Contrato WebSocket versionado y revisado por sus consumidores.
- Matriz actor × destino × operación.
- Matriz criterio → prueba.
- Casos de contrato positivos, negativos y A→B/B→A definidos.
- QA independiente.
- Revisión de seguridad.
- Mapas de dependencia y sprint actualizados.

## Fuera de alcance

- Implementar el servidor o cliente WebSocket.
- Recibir, persistir o cachear ubicaciones.
- Construir el mapa en tiempo real.
- Ejecutar `INT-011`; esta historia solo deja su contrato y puerta de Ready.
- Ampliar `INT-024` web a Mobile, WebSocket o exportaciones.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas, Ola 4E — Ready de tracking en vivo.
- **Predecesoras obligatorias:** `EN-010` — Configurar Spring Security y gestión local de secretos; `EN-011` — Definir catálogo de roles base; `EN-013` — Definir autenticación, sesiones y recuperación; `EN-016` — Definir privacidad, retención y rastreo
- **Historias consecuentes que habilita:** `BE-029` — Recibir ubicaciones; `BE-030` — Mantener última ubicación en Redis; `BE-031` — Publicar ubicación por WebSocket; `FE-020` — Mapa en tiempo real; `INT-011` — Ubicación en tiempo real E2E
- **Validación vertical:** `INT-011` — Ubicación en tiempo real E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR-002 y ADR-006 vigentes; autenticación/sesiones, roles y política de tracking estables.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, Frontend, Seguridad y QA de contrato deben revisarlo.

## Puerta de Ready para las historias desbloqueadas

- EN-020 debe alcanzar DoF `PASS` antes de iniciar Development de `BE-029`,
  `BE-030`, `BE-031`, `FE-020` o `INT-011`.
- La matriz actor × destino × operación y las semánticas de rechazo están
  completas y no contienen decisiones abiertas de producto o seguridad.
- Los consumidores acuerdan versión, destinos, envelope, autenticación,
  autorización, revocación, orden temporal, reconexión y fallback.
- Un mock puede habilitar trabajo posterior solo después de aprobar el contrato;
  no reemplaza al productor real ni permite cerrar la validación E2E.
<!-- delivery-traceability:end -->
