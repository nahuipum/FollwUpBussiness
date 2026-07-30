# INT-001 — Onboarding completo de empresa

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Onboarding  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** superadministrador  
    **Quiero** crear empresa y administrador  
    **Para** habilitar operación

    ## Alcance

    Integrar alta de tenant, configuración y acceso.

    ## Criterios de aceptación

    1. Empresa creada.
2. Administrador inicia sesión.
3. Configuración disponible.
4. Datos aislados.

    ## Referencias

    - Flujo 12.1

    ## Seguridad y privacidad

    - Validar aislamiento multiempresa de extremo a extremo.
- No liberar con hallazgos Critical o High.

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
- **Predecesoras obligatorias:** `BE-001` — Crear una empresa; `BE-006` — Recuperar contraseña; `BE-057` — Provisionar administrador inicial de empresa; `FE-001` — Pantalla de inicio de sesión
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI de empresa/identidad y flujo de activación inicial.
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
