# INT-011 — Ubicación en tiempo real E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** ver ubicación reciente  
    **Para** supervisar vendedores

    ## Alcance

    Background + API + Redis + WebSocket + React.

    ## Criterios de aceptación

    1. Actualizaciones.
2. Hora visible.
3. Stale.
4. Tenant aislado.

    ## Referencias

    - HU-031

    ## Seguridad y privacidad

    - Validar aislamiento multiempresa de extremo a extremo.
- No liberar con hallazgos Critical o High.

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
- **Predecesoras obligatorias:** `BE-029` — Recibir ubicaciones; `BE-030` — Mantener última ubicación en Redis; `BE-031` — Publicar ubicación por WebSocket; `FE-020` — Mapa en tiempo real; `MOB-008` — Capturar ubicación en segundo plano
- **Historias consecuentes que habilita:** `INT-030` — Validación de rendimiento MVP
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

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
