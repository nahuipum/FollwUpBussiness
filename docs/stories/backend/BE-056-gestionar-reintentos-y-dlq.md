# BE-056 — Gestionar reintentos y DLQ

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** operador  
    **Quiero** controlar mensajes fallidos  
    **Para** evitar pérdida silenciosa

    ## Alcance

    Políticas de retry/backoff/DLQ.

    ## Criterios de aceptación

    1. Reintentos limitados.
2. Permanentes a DLQ.
3. CorrelationId.
4. Métrica/alerta.

    ## Referencias

    - RNF-014

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

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `BE-055` — Implementar outbox transaccional; `EN-005` — Configurar Docker Compose con PostGIS, Redis y RabbitMQ
- **Historias consecuentes que habilita:** `BE-019` — Procesar importación de clientes; `BE-050` — Exportar reportes; `BE-053` — Notificar ruta publicada o modificada; `INT-006` — Importación completa de clientes; `INT-027` — Reintentos y DLQ E2E; `INT-040` — Exportación de reportes E2E
- **Validación vertical:** `INT-006` — Importación completa de clientes; `INT-027` — Reintentos y DLQ E2E; `INT-040` — Exportación de reportes E2E

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
