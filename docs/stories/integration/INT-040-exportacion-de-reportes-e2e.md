# INT-040 — Exportación de reportes E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Reportes
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador o supervisor
**Quiero** generar y descargar un reporte filtrado
**Para** analizar la operación fuera del panel sin exponer datos ajenos

## Alcance

Validar solicitud web, proceso asíncrono, archivo seguro, descarga autorizada,
expiración y auditoría.

## Criterios de aceptación

1. El archivo respeta filtros, zona horaria, equipo y tenant.
2. La generación asíncrona muestra progreso, fallo, expiración y reintento.
3. CSV/Excel neutraliza fórmulas y no incluye secretos ni columnas no
   autorizadas.
4. Un usuario sin permiso o de otro tenant no puede consultar ni descargar el
   archivo.
5. La generación y descarga quedan auditadas y correlacionadas.

## Dependencias

- BE-050, BE-056 y FE-031.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 9 — Dashboard, reportes, auditoría y estabilización.
- **Predecesoras obligatorias:** `BE-050` — Exportar reportes; `BE-056` — Gestionar reintentos y DLQ; `FE-031` — Reportes y exportaciones
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/reports`; definiciones de métricas, filtros y exportación.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Filtros, periodo/zona horaria, definiciones de métrica, trabajo de exportación y archivo temporal.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: definición métrica ambigua, datos parciales y exportación entre tenants.

## Fuera de alcance

- cambiar datos fuente y exponer archivos permanentes o entre tenants.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
