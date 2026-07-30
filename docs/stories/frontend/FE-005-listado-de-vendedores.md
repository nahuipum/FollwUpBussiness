# FE-005 — Listado de vendedores

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Vendedores  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** consultar vendedores  
    **Para** gestionar equipo

    ## Alcance

    Tabla con filtros.

    ## Criterios de aceptación

    1. Paginación.
2. Filtros.
3. Vacío/error.
4. Tenant.

    ## Referencias

    - RF-VEN-001..005

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

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-059` — Listar y consultar vendedores; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos
- **Historias consecuentes que habilita:** `FE-006` — Formulario de vendedor; `FE-007` — Activar o inactivar vendedor; `FE-036` — Asignar cartera de clientes; `INT-004` — Alta de vendedor disponible en mobile
- **Validación vertical:** `INT-004` — Alta de vendedor disponible en mobile

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/sellers` y `/territories`; autorización por equipo.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Perfil vendedor, supervisor, zona/territorio, estado y paginación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: selección desactualizada, permisos por equipo y referencias históricas.

## Fuera de alcance

- nómina, comisiones y seguimiento fuera de jornada.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
