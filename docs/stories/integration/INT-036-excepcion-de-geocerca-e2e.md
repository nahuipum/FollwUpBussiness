# INT-036 — Excepción de geocerca E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Visitas
**Prioridad:** Should Have
**Fase:** MVP condicionado

## Historia

**Como** empresa que habilita excepciones
**Quiero** autorizar y consumir una excepción controlada
**Para** atender incidencias sin debilitar la validación normal

## Alcance

Validar configuración, autorización web, consumo mobile, prevención de replay y
auditoría de una excepción.

## Criterios de aceptación

1. Sin configuración o permiso, la autorización y el check-in son rechazados.
2. La autorización queda limitada a tenant, vendedor, cliente y ventana
   temporal.
3. El móvil puede completar un solo check-in autorizado.
4. Reutilización, expiración o cambio de contexto se rechazan.
5. Coordenada, distancia, motivo, actor y resultado quedan auditados.

## Dependencias

- BE-038, FE-038, MOB-013 e INT-013.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `BE-038` — Autorizar excepción de geocerca; `FE-038` — Autorizar excepción de geocerca; `INT-013` — Check-in por geocerca E2E; `MOB-013` — Iniciar visita online
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/visits`; eventos `visit.*`; comandos sync `visit.*`.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Visita, jornada, ruta/cliente, inicio/cierre, coordenadas, resultado, excepción y duración.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, visita simultánea, fraude de ubicación y pérdida offline.

## Fuera de alcance

- borrar historial o convertir automáticamente toda visita en venta.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
