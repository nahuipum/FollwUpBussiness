# MOB-028 — Recuperar cola tras cierre forzado

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recuperar pendientes  
    **Para** no perder operaciones

    ## Alcance

    Sync reiniciable.

    ## Criterios de aceptación

    1. Pending permanece.
2. Sync reanuda.
3. Synced no repite.
4. Errores visibles.

    ## Referencias

    - 15.3
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
- **Predecesoras obligatorias:** `EN-015` — Definir persistencia local y sincronización móvil; `MOB-009` — Encolar ubicaciones sin conexión; `MOB-027` — Proteger datos locales
- **Historias consecuentes que habilita:** `INT-015` — Visita offline sincronizada; `INT-018` — Venta offline sincronizada
- **Validación vertical:** `INT-015` — Visita offline sincronizada; `INT-018` — Venta offline sincronizada

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
