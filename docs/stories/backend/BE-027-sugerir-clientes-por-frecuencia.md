# BE-027 — Sugerir clientes por frecuencia

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** recibir clientes pendientes  
    **Para** cumplir frecuencia

    ## Alcance

    Calcular candidatos por última visita.

    ## Criterios de aceptación

    1. Frecuencias soportadas.
2. Excluye inactivos.
3. Respeta zona.
4. Explica sugerencia.

    ## Referencias

    - RF-RUT-011

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

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas.
- **Predecesoras obligatorias:** `BE-013` — Registrar cliente; `BE-060` — Asignar cartera de clientes
- **Historias consecuentes que habilita:** `FE-015` — Crear ruta manual; `INT-008` — Generación automática E2E
- **Validación vertical:** `INT-008` — Generación automática E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/routes`; eventos `route.*`; versión de ruta para mobile.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Ruta, fecha operativa, estado, versión, vendedor y puntos ordenados con estimaciones.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: estado inválido, versión desactualizada, reasignación concurrente y proveedor caído.

## Fuera de alcance

- tráfico en tiempo real y optimización avanzada no aprobada.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
