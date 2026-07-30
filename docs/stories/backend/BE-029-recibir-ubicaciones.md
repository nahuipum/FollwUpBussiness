# BE-029 — Recibir ubicaciones

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** enviar ubicaciones periódicas  
    **Para** permitir seguimiento

    ## Alcance

    Aceptar lotes y validar muestras.

    ## Criterios de aceptación

    1. Requiere jornada activa.
2. Valida latitud, longitud, precisión y fecha.
3. Marca o rechaza muestra antigua.
4. Idempotente por muestra.

    ## Referencias

    - RF-UBI-002
- RF-UBI-003
- 15.1

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

- **Sprint objetivo:** Sprint 5 — Jornada y tracking en vivo.
- **Predecesoras obligatorias:** `BE-028` — Iniciar jornada; `EN-016` — Definir privacidad, retención y rastreo
- **Historias consecuentes que habilita:** `BE-030` — Mantener última ubicación en Redis; `BE-032` — Consultar historial de recorrido; `BE-033` — Cerrar jornada; `INT-010` — Inicio de jornada y presencia; `INT-011` — Ubicación en tiempo real E2E; `INT-026` — Operación ante caída de Redis; `MOB-008` — Capturar ubicación en segundo plano
- **Validación vertical:** `INT-010` — Inicio de jornada y presencia; `INT-011` — Ubicación en tiempo real E2E; `INT-026` — Operación ante caída de Redis

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
