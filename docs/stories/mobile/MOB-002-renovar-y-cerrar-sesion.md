# MOB-002 — Renovar y cerrar sesión

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** mantener o cerrar sesión  
    **Para** trabajar seguro

    ## Alcance

    Renovación, expiración y logout.

    ## Criterios de aceptación

    1. Renueva según contrato.
2. Logout detiene servicios.
3. Limpia datos definidos.
4. No borra pendientes sin regla.

    ## Referencias

    - RF-AUT-004
- RN-020

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

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-004` — Renovar sesión; `BE-005` — Cerrar y revocar sesión; `MOB-001` — Iniciar sesión móvil
- **Historias consecuentes que habilita:** `INT-003` — Autenticación móvil completa; `MOB-004` — Descargar ruta del día
- **Validación vertical:** `INT-003` — Autenticación móvil completa

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
