# BE-041 — Gestionar productos

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Catálogo  
    **Prioridad:** Should Have
    **Fase:** MVP condicionado al modelo de venta detallada

    ## Historia

    **Como** administrador  
    **Quiero** mantener productos  
    **Para** registrar ventas

    ## Alcance

    CRUD con estado lógico.

    ## Criterios de aceptación

    1. Código único.
2. Precio válido.
3. Inactivo no se usa.
4. Auditoría.

    ## Referencias

    - RF-VTA-003
- Modelo Producto

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

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-051` — Registrar acciones críticas; `BE-058` — Gestionar usuarios de empresa
- **Historias consecuentes que habilita:** `FE-035` — Gestionar catálogo de productos; `INT-035` — Catálogo disponible en venta E2E; `MOB-019` — Consultar catálogo offline; `MOB-021` — Registrar venta detallada
- **Validación vertical:** `INT-035` — Catálogo disponible en venta E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/products`; reglas de vigencia y snapshot comercial.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Producto/concepto, código, nombre, precio decimal, estado y versión de catálogo.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: producto inactivo usado, precio obsoleto y borrado de histórico.

## Fuera de alcance

- inventario, almacenes, impuestos y listas de precios avanzadas.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
