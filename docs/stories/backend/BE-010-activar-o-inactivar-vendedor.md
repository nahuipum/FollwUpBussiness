# BE-010 — Activar o inactivar vendedor

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Workforce  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** cambiar estado  
    **Para** controlar acceso

    ## Alcance

    Inactivación lógica.

    ## Criterios de aceptación

    1. Inactivo no inicia sesión.
2. No recibe rutas nuevas.
3. Historial permanece.
4. Acción auditada.

    ## Referencias

    - RF-VEN-003
- RN-013

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

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-005` — Cerrar y revocar sesión; `BE-008` — Crear vendedor
- **Historias consecuentes que habilita:** `FE-007` — Activar o inactivar vendedor; `INT-004` — Alta de vendedor disponible en mobile; `INT-031` — Retención y eliminación lógica E2E
- **Validación vertical:** `INT-004` — Alta de vendedor disponible en mobile; `INT-031` — Retención y eliminación lógica E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/sellers` y `/territories`; autorización por equipo.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Perfil vendedor, usuario de acceso, supervisor, zona/territorio, estado y vigencia.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: relaciones entre tenants, usuario/perfil desalineado y eliminación de historial.

## Fuera de alcance

- nómina, asistencia laboral y eliminación física de historial.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
