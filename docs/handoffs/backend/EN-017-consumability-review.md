# Revisión de consumibilidad Backend — EN-017

## Estado

`PASS`

## Revalidación del hallazgo previo

| Estado | Evidencia | Resultado |
|---|---|---|
| Resuelto | [RF-RUT-007](../../../00_CONTRATO_FUNCIONAL.md) exige aviso cuando se asigna **o modifica** una ruta; [BE-053](../../stories/backend/BE-053-notificar-ruta-publicada-o-modificada.md) conserva ese alcance. [event-catalog.yaml](../../events/event-catalog.yaml) registra ahora `route.published`, `route.assigned`, `route.modified` y `route.reassigned`, todos v1, con propietario `routing`, consumidor, payload y clave de dedupe. [notification-contract.md](../../events/notification-contract.md) define la semántica de cada tipo y prohíbe otros sin registro/versionado; [ADR-017](../../architecture/adr/ADR-017-canales-notificacion.md) los vincula a la transición de ruta y al outbox. | La modificación y reasignación ya tienen evento consumible, sin inferir cambio desde `route.published` ni inventar un tipo fuera de catálogo. |

## Alcance revisado

- Historia [EN-017](../../stories/enablers/EN-017-definir-canales-de-notificacion.md), handoff de desarrollo, [ADR-017](../../architecture/adr/ADR-017-canales-notificacion.md), contrato de notificaciones y catálogo de eventos.
- Superficies [OpenAPI](../../api/openapi.yaml) (`/devices`, `/devices/{deviceId}`, `POST /auth/logout`), [ADR-008](../../architecture/adr/ADR-008-autenticacion-sesiones.md) y revisión Mobile.
- Código Backend únicamente para verificar límites existentes: `notifications` permanece scaffold y no hay productor, consumidor, migración ni adaptador de EN-017.

## Evidencia confirmada

- Puertos y límites: `identityaccess` usa el puerto interno `RevokeInstallationsForSession(sessionFamilyId, tenantScope)`; no cruza ticket, access/refresh ni token push. `routing` publica mediante envelope/outbox y `notifications` no accede a persistencia ajena.
- Tenant y autorización: `tenantId` es obligatorio en el envelope; destinatarios e instalaciones se revalidan en el mismo tenant. Registro deriva tenant/usuario de sesión y la baja resuelve el binding completo sin revelar pertenencia.
- `/devices`: request canónico alineado con OpenAPI (`installationId`, `ANDROID|IOS`, `pushToken`, `appVersion`, `deviceModel` opcional); propiedades desconocidas rechazadas. Upsert/rotación e `Idempotency-Key` mantienen replay igual y `409` ante cuerpo distinto. `DELETE` es `204` idempotente e indistinguible para propio, ajeno, revocado o inexistente; autenticación/rol se validan antes y no hay `403` por pertenencia del dispositivo.
- Entrega: outbox transaccional, dedupe `tenantId + eventId + recipientTechnicalId + notificationType`, reintentos con backoff+jitter, DLQ/alerta, TTL de 24 h desde `occurredAt` y refresh autoritativo sin fallback email/SMS de rutas están definidos.
- Privacidad y compatibilidad: push bloqueado genérico, sin PII/ruta/enlace/token; `route-notification/v1` limita v1 a adiciones opcionales y conserva `route.published` v1.

## Verificaciones ejecutadas

- `mvn "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest,AuthenticationContractPolicyTest,RouteEngineDecisionPolicyTest" test` con JDK 21 — PASS, 17 pruebas. Cubre límites hexagonales/módulos, contrato de autenticación/logout y compatibilidad existente de `route.published`.
- `mvn "-Dtest=RouteEngineDecisionPolicyTest" test` con JDK 21 — PASS, 6 pruebas, ejecutada sobre la remediación del catálogo `route.*`.
- `git diff --check` — PASS. No repetí el lint OpenAPI: la remediación no altera OpenAPI y el handoff de desarrollo aporta evidencia válida para esa superficie.

## Riesgo y reproducción

Riesgo residual de implementación: BE-053 debe emitir el tipo que corresponda dentro de la misma transacción/outbox, mantener `tenantId`, revalidar instalación activa y autorización, deduplicar entregas y descartar eventos vencidos. Reproducción futura: modificar o reasignar una ruta de un vendedor del tenant y comprobar que se emite respectivamente `route.modified` o `route.reassigned` v1; repetir el mismo envelope no puede invocar una segunda entrega.

No se modificaron código, contratos, ADR ni migraciones durante esta revisión. No se requiere ADR sucesor: la remediación conserva el límite de ADR-017 y registra tipos v1 compatibles. QA y Seguridad pueden continuar según el flujo del repositorio.
