# BE-032 — Consultar historial de recorrido

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Should Have
    **Fase:** MVP ampliado

    ## Historia

    **Como** supervisor  
    **Quiero** consultar recorrido  
    **Para** comparar ejecución

    ## Alcance

    Endpoint de recorrido por jornada.

    ## Criterios de aceptación

    1. Filtro vendedor/fecha.
2. Respeta retención.
3. Secuencia temporal.
4. Permisos.

    ## Referencias

    - RF-UBI-006
- HU-032

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

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

- **Sprint objetivo:** Sprint 6 — Recorrido histórico.
- **Predecesoras obligatorias:** `BE-029` — Recibir ubicaciones; `EN-016` — Definir privacidad, retención y rastreo
- **Historias consecuentes que habilita:** `BE-048` — Reporte por vendedor; `FE-019` — Comparar ruta planificada y ejecutada; `FE-022` — Historial de recorrido; `INT-012` — Recorrido histórico E2E; `INT-039` — Ruta planificada vs. ejecutada E2E
- **Validación vertical:** `INT-012` — Recorrido histórico E2E; `INT-039` — Ruta planificada vs. ejecutada E2E

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
