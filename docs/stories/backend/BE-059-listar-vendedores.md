# BE-059 — Listar y consultar vendedores

**Área:** Backend
**Tipo:** Historia de usuario
**Épica:** Workforce
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador o supervisor
**Quiero** listar y consultar vendedores autorizados
**Para** gestionar el equipo y seleccionar vendedores en rutas, clientes y
reportes

## Alcance

Consulta paginada y detalle con filtros por estado, supervisor, zona y búsqueda
textual.

## Criterios de aceptación

1. La colección es paginada y tiene orden estable.
2. El supervisor solo ve su equipo; el administrador ve su empresa.
3. La respuesta diferencia usuario de acceso, perfil vendedor y estado.
4. Los filtros de supervisor, zona y estado son combinables.
5. Ninguna respuesta incluye credenciales ni datos de otro tenant.

## Fuera de alcance

- Editar, activar o asignar relaciones; corresponden a BE-009 a BE-012.

## Referencias

- RF-VEN-002
- RF-VEN-003
- RN-001
- RN-002

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-008` — Crear vendedor
- **Historias consecuentes que habilita:** `BE-009` — Editar vendedor; `BE-011` — Asignar supervisor; `BE-012` — Asignar territorios; `BE-016` — Listar y filtrar clientes; `BE-021` — Crear ruta manual; `BE-060` — Asignar cartera de clientes; `FE-005` — Listado de vendedores; `INT-004` — Alta de vendedor disponible en mobile; `INT-033` — Gestión de supervisores y equipo E2E; `INT-034` — Asignación de cartera E2E
- **Validación vertical:** `INT-004` — Alta de vendedor disponible en mobile; `INT-033` — Gestión de supervisores y equipo E2E; `INT-034` — Asignación de cartera E2E

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
