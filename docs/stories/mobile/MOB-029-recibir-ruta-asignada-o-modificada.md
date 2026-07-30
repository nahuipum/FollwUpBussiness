# MOB-029 — Recibir ruta asignada o modificada

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Notificaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recibir notificación  
    **Para** enterarme de cambios

    ## Alcance

    Push/local y actualización.

    ## Criterios de aceptación

    1. Fecha/ruta.
2. Sin datos sensibles bloqueado.
3. Abrir actualiza.
4. Offline manejado.

    ## Referencias

    - RF-RUT-007

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

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas.
- **Predecesoras obligatorias:** `BE-053` — Notificar ruta publicada o modificada; `EN-017` — Definir canales de notificación; `MOB-004` — Descargar ruta del día
- **Historias consecuentes que habilita:** `INT-007` — Creación manual E2E; `INT-009` — Reasignación E2E
- **Validación vertical:** `INT-007` — Creación manual E2E; `INT-009` — Reasignación E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Eventos `route.*`, contrato de dispositivo y proveedor de notificaciones.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Evento, destinatario, dispositivo/canal, caducidad, intento y resultado de entrega.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, dispositivo antiguo y exposición en pantalla bloqueada.

## Fuera de alcance

- usar push como fuente de verdad o mostrar datos sensibles bloqueado.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
