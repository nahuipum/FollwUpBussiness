# FE-037 — Gestionar zonas y territorios

**Área:** Frontend
**Tipo:** Historia de usuario
**Épica:** Vendedores
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador
**Quiero** administrar las zonas de mi empresa
**Para** usarlas al organizar vendedores, clientes y rutas

## Alcance

Listado, alta, edición e inactivación del catálogo definido por BE-062.

## Criterios de aceptación

1. Muestra código, nombre, estado y uso de la zona.
2. Valida duplicados y errores de concurrencia.
3. Inactivar requiere confirmación y explica el efecto sobre nuevas
   asignaciones.
4. No elimina ni altera referencias históricas.
5. Incluye estados de carga, vacío, error y sin permiso.

## Fuera de alcance

- Edición de polígonos o mapas de territorios.

## Referencias

- RF-VEN-005
- RF-CLI-007

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-062` — Gestionar zonas y territorios; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos
- **Historias consecuentes que habilita:** `FE-036` — Asignar cartera de clientes; `INT-034` — Asignación de cartera E2E
- **Validación vertical:** `INT-034` — Asignación de cartera E2E

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
