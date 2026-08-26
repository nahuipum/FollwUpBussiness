# BE-025 — Paquete de contexto

Estado: `READY_FOR_HANDOFF`  
Fase: remediación Development requerida por QA  
Candidate-ID: `6e32542+f45de4cde9c4`.

## Decisión de integración Visits

QA demostró que el puerto y la migración de `route_visit` no ofrecen control
efectivo: los flujos de Visits que crearían/cerrarían dichas filas no existen
en este MVP. Mantener `IN_PROGRESS` admitiría una reasignación con visita
abierta pese a la regla, por lo que el hallazgo es `CHANGES_REQUIRED` alto.

Decisión de Orquestación: BE-025 admite exclusivamente rutas `PUBLISHED`.
La reasignación durante ejecución se difiere hasta que Visits tenga su propio
modelo, persistencia y transición de visitas. Development retiró el puerto,
adaptadores, wiring y migración introducidos solo para ese control, y conservó
el resto de BE-025. Esta decisión preserva una regla verificable, no inventa
estado de otro módulo ni transfiere permisos de cartera. Pruebas focalizadas y
`mvn -q clean verify` aprobadas.

## Bloqueo de autorización

Las fuentes vigentes se contradicen respecto a quién puede ejecutar
`POST /routes/{routeId}/reassign`:

- `00_CONTRATO_FUNCIONAL.md`, `RF-RUT-009` (líneas 650–652), declara que el
  administrador puede reasignar una ruta.
- `00_CONTRATO_FUNCIONAL.md`, `HU-022` (líneas 1314–1327), define la historia
  como administrador y no otorga explícitamente esa acción a `SUPERVISOR`.
- `docs/api/openapi.yaml` (líneas 1606–1634) declara
  `x-required-roles: [COMPANY_ADMIN, SUPERVISOR]` para el mismo endpoint,
  sin precisar el alcance de equipo aplicable al supervisor.

Impacto: implementar cualquiera de las dos interpretaciones cambiaría una
política de autorización pública; permitir `SUPERVISOR` sin una regla aprobada
de equipo puede ampliar indebidamente el acceso y denegarlo puede romper el
contrato OpenAPI/consumidores.

Decisión aprobada: `COMPANY_ADMIN` puede operar todas las rutas de su tenant.
`SUPERVISOR` puede operar solo rutas cuyo vendedor actual y vendedor nuevo
pertenezcan a su equipo vigente. `SELLER` no puede reasignar. OpenAPI ya
declara ambos roles; la implementación debe aplicar el alcance de equipo en
servidor, sin revelación ni efectos fuera de él.

## Decisiones operativas aprobadas por Orquestación

`route.reassigned` v1 ya está definido en
`docs/events/notification-contract.md`: cambia vendedor y versión, con el
nuevo vendedor como destinatario mínimo. Para esta historia se aprueba:

- Estado admitido: únicamente `PUBLISHED`; se rechazan `DRAFT`,
  `IN_PROGRESS`, `COMPLETED` y `CANCELLED`.
- Visitas `COMPLETED`, ventas y sus responsables históricos no se cambian.
- Puntos pendientes pasan a estar autorizados para el nuevo vendedor por la
  asignación de esta ruta. Es una habilitación acotada a `routeId`, no una
  modificación de cartera ni un permiso general sobre clientes.
- No se transfiere, inicia ni cierra la jornada de ningún vendedor. La visita
  mantiene su requisito existente de jornada activa; el vendedor entrante la
  inicia por el flujo propio si aún no la tiene.

Estas reglas se publicaron en `RF-RUT-009`, OpenAPI y la historia antes de
Development. No se requiere ADR: no cambian límites de dominio, protocolo,
persistencia ni estrategia de tenant.
