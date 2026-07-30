# INT-018 — Venta offline sincronizada

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Offline  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar venta sin red  
    **Para** no perder operación

    ## Alcance

    Base local + sync + API.

    ## Criterios de aceptación

    1. Pendiente visible.
2. No duplica.
3. Referencia servidor.
4. Dashboard actualiza.

    ## Referencias

    - RF-VTA-012

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

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-042` — Registrar venta; `EN-015` — Definir persistencia local y sincronización móvil; `FE-026` — Ventas del día; `MOB-022` — Sincronizar venta idempotente; `MOB-028` — Recuperar cola tras cierre forzado
- **Historias consecuentes que habilita:** `INT-032` — Revisión de seguridad del flujo crítico
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Contrato mobile sync versionado, idempotencia y resolución de conflictos.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Comando local, UUID idempotente, secuencia, fecha del dispositivo, estado sync, conflicto y referencia servidor.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: replay, conflicto, pérdida de cola y mezcla de usuarios.

## Fuera de alcance

- resolver conflictos silenciosamente o borrar comandos sin confirmación.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
