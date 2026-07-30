# INT-031 — Retención y eliminación lógica E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Privacidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** aplicar retención  
    **Para** cumplir privacidad

    ## Alcance

    Configuración + jobs + consultas.

    ## Criterios de aceptación

    1. Historial requerido.
2. Ubicación expira.
3. Eliminación lógica.
4. Acceso restringido.

    ## Referencias

    - RN-013
- 17.3

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
- **Predecesoras obligatorias:** `BE-010` — Activar o inactivar vendedor; `BE-014` — Editar cliente y ubicación; `BE-044` — Anular venta; `BE-051` — Registrar acciones críticas; `EN-016` — Definir privacidad, retención y rastreo
- **Historias consecuentes que habilita:** `INT-032` — Revisión de seguridad del flujo crítico
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Política de tracking/retención y ADR de almacenamiento local.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Datos locales cifrados, tenant/usuario propietario, retención y estado de tracking.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: rastreo fuera de jornada, cache local residual y retención excesiva.

## Fuera de alcance

- rastreo fuera de jornada y conservación indefinida.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
