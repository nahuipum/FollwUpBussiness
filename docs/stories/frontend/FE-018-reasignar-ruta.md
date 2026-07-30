# FE-018 — Reasignar ruta

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Should Have
    **Fase:** MVP condicionado por operación del piloto

    ## Historia

    **Como** administrador  
    **Quiero** cambiar vendedor  
    **Para** resolver ausencia

    ## Alcance

    Flujo con impacto.

    ## Criterios de aceptación

    1. Vendedor activo.
2. No pierde visitas.
3. Actualiza detalle.
4. Notificación visible.

    ## Referencias

    - RF-RUT-009
- HU-022

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

    ## Observabilidad

    - Propagar correlationId cuando aplique.
    - Registrar resultado y error sin datos sensibles.
    - Añadir métrica o evento operativo en flujos críticos.

    ## Evidencia mínima para DoF

    - Implementación asociada a la historia.
    - Pruebas y evidencia.
    - Matriz criterio → evidencia.
    - QA independiente.
    - Revisión de seguridad cuando aplique.
    - Contratos y documentación actualizados.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas.
- **Predecesoras obligatorias:** `BE-025` — Reasignar ruta; `FE-014` — Listado de rutas
- **Historias consecuentes que habilita:** `INT-009` — Reasignación E2E
- **Validación vertical:** `INT-009` — Reasignación E2E

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
