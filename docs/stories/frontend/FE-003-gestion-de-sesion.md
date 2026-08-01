# FE-003 — Gestión de sesión

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario  
    **Quiero** mantener y cerrar sesión  
    **Para** trabajar seguro

    ## Alcance

    Expiración, renovación y logout.

    ## Criterios de aceptación

    1. Renueva según contrato.
2. Expiración redirige.
3. Logout limpia cache.
4. No conserva tenant previo.

    ## Referencias

    - RF-AUT-004

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
- **Predecesoras obligatorias:** `BE-004` — Renovar sesión; `BE-005` — Cerrar y revocar sesión; `FE-001` — Pantalla de inicio de sesión
- **Historias consecuentes que habilita:** `FE-004` — Gestión de usuarios y roles; `FE-005` — Listado de vendedores; `FE-008` — Listado y filtros de clientes; `FE-014` — Listado de rutas; `FE-020` — Mapa en tiempo real; `FE-022` — Historial de recorrido; `FE-023` — Listado de visitas; `FE-026` — Ventas del día; `FE-030` — Dashboard diario; `FE-032` — Consulta de auditoría; `FE-033` — Configurar geocerca y tracking; `FE-035` — Gestionar catálogo de productos; `FE-037` — Gestionar zonas y territorios; `INT-002` — Autenticación web completa
- **Validación vertical:** `INT-002` — Autenticación web completa

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de autenticación; OpenAPI `/auth/*`; manejo de sesión por cliente.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Identidad autenticada, tenant, roles/permisos, expiración y estado de sesión; nunca contraseña o token en logs.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: fuga de credenciales, cache residual, sesión vencida y cruce de tenant.

## Fuera de alcance

- registro público y almacenamiento inseguro de credenciales.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
