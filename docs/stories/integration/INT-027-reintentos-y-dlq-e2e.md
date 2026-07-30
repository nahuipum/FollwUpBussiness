# INT-027 — Reintentos y DLQ E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** operador  
    **Quiero** gestionar procesos fallidos  
    **Para** evitar pérdida silenciosa

    ## Alcance

    Outbox + RabbitMQ + consumidores + monitoring.

    ## Criterios de aceptación

    1. Retry limitado.
2. DLQ visible.
3. Idempotencia.
4. Alerta.

    ## Referencias

    - ADR-005
- RNF-014

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

- **Sprint objetivo:** Sprint 9 — Dashboard, reportes, auditoría y estabilización.
- **Predecesoras obligatorias:** `BE-019` — Procesar importación de clientes; `BE-053` — Notificar ruta publicada o modificada; `BE-055` — Implementar outbox transaccional; `BE-056` — Gestionar reintentos y DLQ
- **Historias consecuentes que habilita:** `INT-032` — Revisión de seguridad del flujo crítico
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Envelope de eventos, outbox, retry/backoff, DLQ y observabilidad.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Outbox/evento, intento, backoff, estado, correlationId, causationId y DLQ.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: reintentos infinitos, mensajes venenosos y operación silenciosamente degradada.

## Fuera de alcance

- reintentos infinitos y usar la cola como única fuente de negocio.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
