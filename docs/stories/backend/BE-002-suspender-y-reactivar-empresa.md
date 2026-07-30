# BE-002 — Suspender y reactivar empresa

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Base SaaS  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** superadministrador  
    **Quiero** suspender o reactivar una empresa  
    **Para** controlar el acceso

    ## Alcance

    Bloquear nuevas sesiones sin eliminar historial.

    ## Criterios de aceptación

    1. Empresa suspendida no inicia sesión.
2. Reactivación restablece acceso.
3. Historial intacto.
4. Acción auditada.

    ## Referencias

    - Tipos de usuario 6.4

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

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-001` — Crear una empresa; `BE-005` — Cerrar y revocar sesión; `BE-051` — Registrar acciones críticas
- **Historias consecuentes que habilita:** `INT-038` — Suspensión y reactivación de empresa E2E
- **Validación vertical:** `INT-038` — Suspensión y reactivación de empresa E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI de empresas y configuración; auditoría de cambios.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Empresa, estado, zona horaria, parámetros iniciales y actor de plataforma.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: tenant incorrecto, empresa suspendida y configuración parcial.

## Fuera de alcance

- autoservicio público, facturación del SaaS y planes comerciales.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
