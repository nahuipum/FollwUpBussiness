# FE-034 — Manejo global de errores y permisos

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Experiencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario web  
    **Quiero** recibir mensajes claros  
    **Para** saber qué hacer

    ## Alcance

    Manejo uniforme 401/403/404/409/422/500.

    ## Criterios de aceptación

    1. Sin datos sensibles.
2. Acción sugerida.
3. Sesión vencida.
4. CorrelationId visible.

    ## Referencias

    - RNF-002
- RNF-006

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

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-003` — Autenticar usuario; `BE-007` — Gestionar roles y permisos
- **Historias consecuentes que habilita:** `FE-004` — Gestión de usuarios y roles; `FE-005` — Listado de vendedores; `FE-008` — Listado y filtros de clientes; `FE-014` — Listado de rutas; `FE-020` — Mapa en tiempo real; `FE-022` — Historial de recorrido; `FE-023` — Listado de visitas; `FE-026` — Ventas del día; `FE-030` — Dashboard diario; `FE-032` — Consulta de auditoría; `FE-033` — Configurar geocerca y tracking; `FE-035` — Gestionar catálogo de productos; `FE-037` — Gestionar zonas y territorios; `FE-038` — Autorizar excepción de geocerca; `INT-002` — Autenticación web completa
- **Validación vertical:** `INT-002` — Autenticación web completa

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Catálogo de errores API, estados degradados y correlationId.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Identificadores, tenant/propietario, estado, timestamps de negocio y auditoría aplicables.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: error engañoso, información sensible y falta de acción recuperable.

## Fuera de alcance

- capacidades no descritas en el alcance y cambios de arquitectura sin ADR.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
