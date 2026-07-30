# MOB-009 — Encolar ubicaciones sin conexión

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** guardar ubicaciones  
    **Para** evitar huecos

    ## Alcance

    Persistencia local temporal.

    ## Criterios de aceptación

    1. No pierde muestras relevantes.
2. Envía lotes.
3. Límite local.
4. Retención.

    ## Referencias

    - RNF-012
- RNF-013

    ## Seguridad y privacidad

    - Usar almacenamiento seguro.
- Rastrear solo durante jornada activa.

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
- **Predecesoras obligatorias:** `EN-015` — Definir persistencia local y sincronización móvil; `MOB-008` — Capturar ubicación en segundo plano
- **Historias consecuentes que habilita:** `MOB-010` — Mostrar conectividad y sincronización; `MOB-028` — Recuperar cola tras cierre forzado
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

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
