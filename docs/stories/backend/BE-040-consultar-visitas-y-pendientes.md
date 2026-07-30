# BE-040 — Consultar visitas y pendientes

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** filtrar visitas  
    **Para** controlar cumplimiento

    ## Alcance

    Listar realizadas, pendientes y fuera de ruta.

    ## Criterios de aceptación

    1. Filtros.
2. Duración/resultado.
3. Distancia check-in.
4. Permisos.

    ## Referencias

    - RF-VIS-009
- HU-043

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

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `BE-035` — Iniciar visita; `BE-036` — Finalizar visita; `BE-061` — Consultar rutas y ruta del día
- **Historias consecuentes que habilita:** `BE-017` — Consultar historial de cliente; `BE-047` — Calcular dashboard diario; `BE-048` — Reporte por vendedor; `FE-019` — Comparar ruta planificada y ejecutada; `FE-021` — Detalle de vendedor activo; `FE-023` — Listado de visitas; `FE-024` — Detalle de visita; `INT-016` — Consulta administrativa de visitas; `INT-039` — Ruta planificada vs. ejecutada E2E
- **Validación vertical:** `INT-016` — Consulta administrativa de visitas; `INT-039` — Ruta planificada vs. ejecutada E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/visits`; eventos `visit.*`; comandos sync `visit.*`.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Visita, jornada, ruta/cliente, inicio/cierre, coordenadas, resultado, excepción y duración.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, visita simultánea, fraude de ubicación y pérdida offline.

## Fuera de alcance

- borrar historial o convertir automáticamente toda visita en venta.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
