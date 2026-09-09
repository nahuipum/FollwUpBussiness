# Paquete de contexto — FE-017

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `a189f4d+fe017-99dadf74e342`.

## Alcance y decisión de integración

Implementar la acción administrativa de publicar una ruta existente. No hay mockup FE-017 ni se crea/modifica uno. Ubicar la acción en el flujo existente de `company-routes` (listado/detalle), según el patrón mínimo que confirme Development; no añadir entrada de sidebar.

## Contrato estable verificado

`POST /routes/{routeId}/publish`, roles `COMPANY_ADMIN` y `SUPERVISOR`; cabeceras `X-Correlation-Id`, `Idempotency-Key`, `If-Match`; body opcional `{ notifySeller }` (por defecto `true`); éxito `200 Route` actualizado. Manejar `400`, `403`, `404`, `409`, `422`, red/sesión. `notifySeller=false` solo omite el push posterior: no bloquea publicación ni `route.published`.

## Invariantes y criterios

- Mostrar/ejecutar solo para Admin o Supervisor con ruta localmente elegible; Backend mantiene tenant, rol, equipo vigente, vendedor activo, `DRAFT` y snapshot `VALID` de la versión.
- Antes del POST, confirmar nombre del vendedor, fecha operativa, estado actual y disponibilidad para el vendedor. No mostrar datos personales innecesarios.
- Generar una clave de idempotencia por intento lógico y bloquear doble envío; usar versión vigente como `If-Match`.
- En `200`, mostrar confirmación/éxito reutilizable, reflejar `PUBLISHED`, versión y datos retornados; refrescar/invalidad listado, detalle y caché.
- En `409`, informar conflicto y recargar sin sobrescribir con estado local. Las demás respuestas deben ser recuperables, accesibles y sin registros sensibles.
- Limpiar selección, solicitud activa y caché al logout/cambio de tenant. Seller no tiene acceso administrativo; el frontend no sustituye autorización Backend.

## Evidencia inicial

- Historia: `docs/stories/frontend/FE-017-publicar-ruta.md`.
- Dependencia/contrato: `docs/api/openapi.yaml` (`/routes/{routeId}/publish`, `PublishRouteRequest`) y `docs/handoffs/governance/BE-024-context-package.md`.
- Patrones a inspeccionar: FE-014/FE-015, `src/features/company-routes`, API/session/permisos, modales y pruebas adyacentes.

## Delta Development

- La disponibilidad se obtiene en el listado paginado de `/sellers` mediante `Seller.status`; se conserva junto al nombre y evita N+1. Se consultó el fragmento de `docs/api/openapi.yaml` por la ambigüedad de disponibilidad, ya que el modelo previo la descartaba.
- FE-017 incorpora confirmación, POST con `X-Correlation-Id`, `Idempotency-Key` e `If-Match`, manejo recuperable de errores y limpieza por cambio de sesión/empresa. La publicación exitosa reemplaza detalle y recarga listado.
- Ajuste visual posterior: la confirmación de publicación usa una variante compacta de 680 px, en vez del visor de 1200 px, y el checkbox adopta el patrón de confirmación existente (18 px, `accent-color` petróleo, borde y foco accesible). No cambia contrato ni comportamiento.

## Restricciones operativas

Árbol de trabajo ya contiene cambios ajenos en layout/UI compartidos; no revertirlos ni atribuirlos a FE-017. No modificar Backend salvo brecha contractual comprobada. Development deja handoff y Candidate-ID; QA, Seguridad y DoF validan ese mismo candidato.
