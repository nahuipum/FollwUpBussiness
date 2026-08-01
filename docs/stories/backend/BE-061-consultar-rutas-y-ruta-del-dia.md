# BE-061 — Consultar rutas y ruta del día

**Área:** Backend
**Tipo:** Historia de usuario
**Épica:** Rutas
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** usuario autorizado
**Quiero** consultar rutas y su detalle
**Para** planificar desde el panel y ejecutar mi ruta vigente desde el móvil

## Alcance

Listado administrativo paginado, detalle de ruta y consulta móvil de la ruta
publicada para la fecha operativa del vendedor.

## Criterios de aceptación

1. Administrador y supervisor consultan únicamente rutas autorizadas.
2. El vendedor solo consulta sus rutas publicadas/asignadas.
3. La fecha operativa usa la zona horaria de la empresa.
4. El detalle incluye estado, versión, vendedor y secuencia completa de puntos.
5. Una modificación o reasignación permite al cliente detectar que su copia
   local está desactualizada.
6. Las respuestas no mezclan rutas, clientes o vendedores de otro tenant.

## Fuera de alcance

- Crear, optimizar, publicar o reasignar rutas.
- Navegación paso a paso dentro de la aplicación.

## Referencias

- RF-RUT-005
- RF-RUT-006
- RF-RUT-007
- RN-014

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas.
- **Predecesoras obligatorias:** `BE-021` — Crear ruta manual; `BE-024` — Publicar ruta
- **Historias consecuentes que habilita:** `BE-028` — Iniciar jornada; `BE-040` — Consultar visitas y pendientes; `FE-014` — Listado de rutas; `FE-015` — Crear ruta manual; `FE-019` — Comparar ruta planificada y ejecutada; `INT-007` — Creación manual E2E; `INT-008` — Generación automática E2E; `INT-039` — Ruta planificada vs. ejecutada E2E; `MOB-004` — Descargar ruta del día
- **Validación vertical:** `INT-007` — Creación manual E2E; `INT-008` — Generación automática E2E; `INT-039` — Ruta planificada vs. ejecutada E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/routes`; eventos `route.*`; versión de ruta para mobile.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Ruta, fecha operativa, estado, versión, vendedor y puntos ordenados con estimaciones.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: estado inválido, versión desactualizada, reasignación concurrente y proveedor caído.

## Fuera de alcance

- tráfico en tiempo real y optimización avanzada no aprobada.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
