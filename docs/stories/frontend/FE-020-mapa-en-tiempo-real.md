# FE-020 — Mapa en tiempo real

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** ver vendedores activos  
    **Para** supervisar jornada

    ## Alcance

    Mapa conectado por WebSocket.

    ## Criterios de aceptación

    1. Ubicación/hora.
2. Stale diferenciado.
3. Filtro equipo.
4. Reconexión/fallback.

    ## Referencias

    - RF-UBI-004
- HU-031

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

- **Sprint objetivo:** Sprint 5 — Jornada y tracking en vivo.
- **Predecesoras obligatorias:** `BE-031` — Publicar ubicación por WebSocket; `EN-014` — Definir proveedor de mapas, geocodificación y navegación; `EN-016` — Definir privacidad, retención y rastreo; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos
- **Historias consecuentes que habilita:** `FE-021` — Detalle de vendedor activo; `INT-010` — Inicio de jornada y presencia; `INT-011` — Ubicación en tiempo real E2E; `INT-023` — Cierre de jornada y detención de tracking; `INT-026` — Operación ante caída de Redis
- **Validación vertical:** `INT-010` — Inicio de jornada y presencia; `INT-011` — Ubicación en tiempo real E2E; `INT-023` — Cierre de jornada y detención de tracking; `INT-026` — Operación ante caída de Redis

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI de ubicaciones; evento `seller.location.updated`; contrato WebSocket.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Muestra con capturedAt/receivedAt, punto PostGIS, precisión, fuente, jornada y estado stale.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: ubicación antigua presentada como actual, orden temporal y caída de Redis/WebSocket.

## Fuera de alcance

- presentar datos antiguos como tiempo real y usar Redis como fuente de verdad.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
