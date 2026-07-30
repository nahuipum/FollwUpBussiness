# INT-033 — Gestión de supervisores y equipo E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Workforce
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador
**Quiero** crear un supervisor y asignarle vendedores
**Para** delegar la supervisión sin exponer otros equipos

## Alcance

Validar en conjunto invitación/activación, gestión web, relación de equipo,
autorización backend y consultas restringidas del supervisor.

## Criterios de aceptación

1. El administrador invita un usuario con rol `SUPERVISOR`.
2. Tras activar su cuenta, el supervisor inicia sesión.
3. Los vendedores asignados aparecen en su equipo y los no asignados no.
4. Las consultas de clientes, rutas, tracking, visitas y reportes respetan el
   alcance del equipo.
5. Alta y cambios de equipo quedan auditados.

## Dependencias

- BE-058, BE-011, BE-059, FE-004 y FE-006.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-011` — Asignar supervisor; `BE-058` — Gestionar usuarios de empresa; `BE-059` — Listar y consultar vendedores; `FE-004` — Gestión de usuarios y roles; `FE-006` — Formulario de vendedor
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

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
