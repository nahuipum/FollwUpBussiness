# BE-062 — Gestionar zonas y territorios

**Área:** Backend
**Tipo:** Historia de usuario
**Épica:** Workforce
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador
**Quiero** crear, editar, listar e inactivar zonas de mi empresa
**Para** asignar vendedores y clientes usando un catálogo consistente

## Alcance

Catálogo tenant-bound de zonas/territorios con código, nombre, estado y
descripción opcional. El MVP no exige polígonos geográficos.

## Criterios de aceptación

1. Código y nombre se validan dentro del tenant.
2. Una zona usada se inactiva lógicamente y conserva sus referencias históricas.
3. Solo zonas activas pueden recibir nuevas asignaciones.
4. Listados y selectores usan orden estable y estado explícito.
5. Toda modificación queda auditada.

## Fuera de alcance

- Dibujar polígonos, balancear territorios u optimizar carteras.

## Referencias

- RF-VEN-005
- RF-CLI-007
- RN-013

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-051` — Registrar acciones críticas; `BE-058` — Gestionar usuarios de empresa
- **Historias consecuentes que habilita:** `BE-008` — Crear vendedor; `BE-012` — Asignar territorios; `BE-013` — Registrar cliente; `BE-060` — Asignar cartera de clientes; `FE-006` — Formulario de vendedor; `FE-037` — Gestionar zonas y territorios; `INT-034` — Asignación de cartera E2E
- **Validación vertical:** `INT-034` — Asignación de cartera E2E

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
