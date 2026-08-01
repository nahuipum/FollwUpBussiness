# EN-018 — Definir motor de rutas y límites del MVP

**Área:** Arquitectura / Producto
**Tipo:** Enabler funcional y técnico
**Épica:** Rutas
**Prioridad:** Must Have
**Fase:** MVP

## Objetivo

Definir el algoritmo o proveedor para la optimización básica, sus entradas,
límites, costos y comportamiento cuando no pueda calcular una propuesta.

## Criterios de aceptación

1. Se confirman punto inicial/final, máximo de clientes, ventanas horarias y
   duración estimada de visita soportados en MVP.
2. Se define la métrica de optimización y se evita prometer tráfico en tiempo
   real.
3. Se documentan cuotas, timeouts, fallback manual y reproducibilidad.
4. Se define cómo versionar la propuesta y conservar la edición humana.
5. La decisión se registra mediante ADR.

## Dependencias y desbloqueos

- Depende de EN-014 y de la decisión de alcance del piloto.
- Desbloquea BE-022, FE-016 e INT-008.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-014` — Definir proveedor de mapas, geocodificación y navegación
- **Historias consecuentes que habilita:** `BE-022` — Generar ruta automática básica; `FE-016` — Generar ruta automática
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

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
