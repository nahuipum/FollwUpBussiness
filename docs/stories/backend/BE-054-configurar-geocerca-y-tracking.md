# BE-054 — Configurar geocerca y tracking

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Configuración  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ajustar radio y frecuencia  
    **Para** adaptar operación

    ## Alcance

    Endpoint de parámetros.

    ## Criterios de aceptación

    1. Límites válidos.
2. Aplica a nuevas validaciones.
3. Permisos.
4. Auditoría.

    ## Referencias

    - RN-006
- RF-UBI-003

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

- **Sprint objetivo:** Sprint 3 — Importación y configuración operativa.
- **Predecesoras obligatorias:** `BE-001` — Crear una empresa; `BE-051` — Registrar acciones críticas; `EN-016` — Definir privacidad, retención y rastreo
- **Historias consecuentes que habilita:** `BE-028` — Iniciar jornada; `BE-034` — Validar proximidad; `BE-037` — Registrar visita fuera de ruta; `BE-043` — Editar venta dentro de ventana; `FE-033` — Configurar geocerca y tracking; `INT-013` — Check-in por geocerca E2E
- **Validación vertical:** `INT-013` — Check-in por geocerca E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI de parámetros tenant-bound y auditoría.
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

- QA y Seguridad deben cubrir: permisos, aislamiento multiempresa, concurrencia, recuperación y observabilidad.

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
