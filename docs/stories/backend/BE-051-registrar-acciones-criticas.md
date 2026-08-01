# BE-051 — Registrar acciones críticas

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Auditoría  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** auditor  
    **Quiero** tener trazabilidad  
    **Para** investigar cambios

    ## Alcance

    Capturar acciones del contrato.

    ## Criterios de aceptación

    1. Empresa/usuario/entidad/fecha.
2. Anterior/nuevo.
3. Inmutable ordinariamente.
4. Retención.

    ## Referencias

    - RF-AUD-001
- RF-AUD-002

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
- **Predecesoras obligatorias:** `BE-003` — Autenticar usuario; `BE-007` — Gestionar roles y permisos
- **Historias consecuentes que habilita:** `BE-001` — Crear una empresa; `BE-002` — Suspender y reactivar empresa; `BE-038` — Autorizar excepción de geocerca; `BE-039` — Corregir visita; `BE-041` — Gestionar productos; `BE-044` — Anular venta; `BE-052` — Consultar auditoría; `BE-054` — Configurar geocerca y tracking; `BE-057` — Provisionar administrador inicial de empresa; `BE-058` — Gestionar usuarios de empresa; `BE-062` — Gestionar zonas y territorios; `INT-025` — Auditoría transversal; `INT-031` — Retención y eliminación lógica E2E; `INT-037` — Edición de venta E2E
- **Validación vertical:** `INT-025` — Auditoría transversal; `INT-031` — Retención y eliminación lógica E2E; `INT-037` — Edición de venta E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Modelo inmutable, OpenAPI `/audit` y política de retención.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Tenant, actor, operación, entidad, anterior/nuevo permitido, fecha, correlationId y motivo.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: datos sensibles en auditoría, mutabilidad y retención incorrecta.

## Fuera de alcance

- registrar contraseñas, tokens, documentos completos o coordenadas innecesarias.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
