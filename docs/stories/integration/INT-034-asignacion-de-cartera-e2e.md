# INT-034 — Asignación de cartera E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Clientes
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador
**Quiero** asignar clientes a un vendedor y comprobar el resultado
**Para** planificar rutas sobre una cartera confiable

## Alcance

Validar panel, API, persistencia de historial y efecto observable de una
asignación individual y masiva.

## Criterios de aceptación

1. La asignación individual y masiva se refleja en filtros y detalle.
2. El vendedor solo recibe en su ruta clientes permitidos para la política
   vigente.
3. La reasignación conserva visitas, ventas y rutas históricas.
4. Un cliente o vendedor de otro tenant siempre es rechazado.
5. La operación queda auditada y los conflictos son visibles.

## Dependencias

- BE-059, BE-060, BE-062, FE-036 y FE-037.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-059` — Listar y consultar vendedores; `BE-060` — Asignar cartera de clientes; `BE-062` — Gestionar zonas y territorios; `FE-036` — Asignar cartera de clientes; `FE-037` — Gestionar zonas y territorios
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/customers`; modelo PostGIS, filtros y asignación de cartera.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Cliente, dirección, punto PostGIS, estado, zona, vendedor responsable e historial de asignación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, coordenadas erróneas, asignación desactualizada y BOLA.

## Fuera de alcance

- CRM omnicanal, cobranzas y geocodificación aceptada sin confirmación.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
