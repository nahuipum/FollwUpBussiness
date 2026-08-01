# INT-038 — Suspensión y reactivación de empresa E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Onboarding
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma
**Quiero** suspender y reactivar una empresa
**Para** controlar el acceso sin perder su información

## Alcance

Validar estado de empresa, login/renovación, aislamiento de otros tenants,
reactivación e historial.

## Criterios de aceptación

1. La suspensión impide nuevas sesiones y revoca o bloquea la renovación según
   el ADR.
2. Las sesiones de otros tenants continúan operando.
3. Datos, auditoría e históricos de la empresa suspendida permanecen intactos.
4. La reactivación permite volver a autenticarse sin restauraciones manuales.
5. Suspensión y reactivación quedan auditadas.

## Dependencias

- BE-002, BE-003, BE-004, BE-005 y FE-001.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-002` — Suspender y reactivar empresa; `BE-003` — Autenticar usuario; `BE-004` — Renovar sesión; `BE-005` — Cerrar y revocar sesión; `FE-001` — Pantalla de inicio de sesión
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
