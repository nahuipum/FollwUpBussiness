# INT-039 — Ruta planificada vs. ejecutada E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Rutas
**Prioridad:** Should Have
**Fase:** MVP ampliado

## Historia

**Como** supervisor
**Quiero** comparar la ruta publicada con la ejecución real
**Para** identificar visitados, omitidos y visitas fuera de ruta

## Alcance

Validar persistencia de la versión planificada, tracking/visitas ejecutadas,
consulta backend y representación web.

## Criterios de aceptación

1. Conserva la versión planificada aun después de iniciar la jornada.
2. Distingue visitados, omitidos, fuera de ruta y orden real.
3. Distancia/recorrido muestran fuente, periodo y disponibilidad.
4. Una reasignación no atribuye visitas históricas al vendedor equivocado.
5. Mapa y alternativa tabular respetan equipo y tenant.

## Dependencias

- BE-032, BE-040, BE-061, FE-019, INT-012 e INT-016.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `BE-032` — Consultar historial de recorrido; `BE-040` — Consultar visitas y pendientes; `BE-061` — Consultar rutas y ruta del día; `FE-019` — Comparar ruta planificada y ejecutada; `INT-012` — Recorrido histórico E2E; `INT-016` — Consulta administrativa de visitas
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

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
