# FE-031 — Reportes y exportaciones

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Reportes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** generar reportes  
    **Para** analizar resultados

    ## Alcance

    Vistas y descargas.

    ## Criterios de aceptación

    1. Estado generación.
2. Filtros.
3. Expiración.
4. Sin datos ajenos.

    ## Referencias

    - RF-REP-002..005

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

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
- **Predecesoras obligatorias:** `BE-050` — Exportar reportes; `FE-030` — Dashboard diario
- **Historias consecuentes que habilita:** `INT-040` — Exportación de reportes E2E
- **Validación vertical:** `INT-040` — Exportación de reportes E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/reports`; definiciones de métricas, filtros y exportación.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Filtros, periodo/zona horaria, definiciones de métrica, trabajo de exportación y archivo temporal.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: definición métrica ambigua, datos parciales y exportación entre tenants.

## Fuera de alcance

- cambiar datos fuente y exponer archivos permanentes o entre tenants.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
