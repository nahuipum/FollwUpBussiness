# FE-038 — Autorizar excepción de geocerca

**Área:** Frontend
**Tipo:** Historia de usuario
**Épica:** Visitas
**Prioridad:** Should Have
**Fase:** MVP condicionado

## Historia

**Como** administrador con permiso de excepción
**Quiero** autorizar de forma limitada un check-in fuera de geocerca
**Para** resolver una incidencia real sin ocultar la ubicación original

## Alcance

Formulario de autorización asociado a vendedor, cliente y ventana temporal, con
motivo obligatorio y resumen de distancia/precisión disponible.

## Criterios de aceptación

1. La acción solo aparece con permiso explícito y configuración habilitada.
2. Muestra vendedor, cliente, distancia, precisión y hora de la solicitud.
3. Exige motivo y confirmación; nunca permite alterar la coordenada original.
4. La autorización es de un solo uso, caduca y no sirve para otro tenant,
   vendedor o cliente.
5. Resultado, rechazo y expiración son visibles y auditables.

## Fuera de alcance

- Habilitar excepciones globales o corregir coordenadas del cliente.

## Referencias

- RN-007
- RF-VIS-008

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `BE-038` — Autorizar excepción de geocerca; `FE-023` — Listado de visitas; `FE-034` — Manejo global de errores y permisos
- **Historias consecuentes que habilita:** `INT-036` — Excepción de geocerca E2E
- **Validación vertical:** `INT-036` — Excepción de geocerca E2E

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
