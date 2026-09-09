# FE-017 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `a189f4d+fe017-21f65e30d556`

## Superficie revisada

Publicación administrativa `POST /routes/{routeId}/publish`: visibilidad por rol y elegibilidad, aislamiento de sesión/tenant, autorización y CSRF, concurrencia con `If-Match`, idempotencia/doble envío, cambio de tenant/logout y exposición de datos del vendedor. Se revisaron el paquete, los handoffs Dev/QA, el diff y el código/pruebas afectados; `HEAD` verificado en `a189f4d` y la firma declarada coincide.

## Resultado y evidencia

- **PASS — roles, tenant y equipo:** la UI limita la acción a `COMPANY_ADMIN`/`SUPERVISOR`, `DRAFT` y vendedor `ACTIVE`; no presenta la acción a Seller. Es ocultamiento UX, no autorización: la petición conserva Bearer y el Backend sigue siendo responsable de tenant, rol, equipo y vigencia.
- **PASS — mutación protegida:** `publishRoute` codifica `routeId`, envía `X-CSRF-Token`, `X-Correlation-Id`, `Idempotency-Key` e `If-Match` con la versión vigente; el body solo contiene `notifySeller`.
- **PASS — repetición y cambio de contexto:** `busyRef` bloquea envíos concurrentes, la clave se conserva durante el intento lógico y se descarta al cerrarlo. El cambio de sesión/empresa invalida solicitud, selección y resultado; una respuesta obsoleta no actualiza el nuevo tenant.
- **PASS — datos y errores:** se muestran solo nombre del vendedor, fecha, estado y disponibilidad necesarios; no se agregan logs, almacenamiento local ni exposición de coordenadas, clientes, tokens o secretos. Los errores no reflejan payloads sensibles.

**Abuso reproducido (PASS):** publicación en vuelo seguida de cambio `tenant-a → tenant-b`; la prueba focal `useRoutePublish.test.tsx -t "usa una única mutación..."` pasó y confirmó una sola llamada, limpieza del estado y ausencia de actualización tardía.

## Hallazgos y riesgos residuales

Sin hallazgos explotables. **No aplican:** WebSocket, cache/Redis, mensajería directa, archivos, dependencias e infraestructura (sin cambios). Riesgo residual: un cliente manipulado puede invocar el endpoint pese al ocultamiento; queda contenido únicamente si Backend mantiene los controles declarados de autorización, tenant/equipo, estado y versión.
