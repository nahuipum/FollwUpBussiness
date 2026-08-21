# INT-033 — Paquete de contexto

**Candidate-ID:** `c54d395 + 6969742688f9`

**Estado actual:** DoF `PASS`

## Alcance y controles

Flujo solicitado: invitación y activación de `SUPERVISOR`, asignación/reasignación de vendedores activos del tenant y restricción efectiva para `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`. Invariantes: actor/recurso/tenant; equipo vigente; denegación sin filtración; concurrencia/repetición; revocación tras cambio de relación/estado/rol/tenant.

## Diagnóstico

- `POST /company/users` permite invitar `SUPERVISOR`; la activación reutiliza el mecanismo de identidad y la inactivación revoca familias de sesión. `PUT /sellers/{sellerId}/supervisor` exige administrador, mismo tenant y supervisor activo; la asignación usa control optimista y auditoría.
- `/sellers` restringe al supervisor a su equipo y `/customers` aplica alcance de cartera/equipo en SQL. Territorios se limitan a tenant, conforme a su contrato actual.
- Bloqueante alto: rutas, tracking, visitas y reportes figuran en OpenAPI, pero no tienen controladores/adaptadores Backend implementados. Por tanto no existe una superficie real que pueda validar o imponer el criterio 6. `SecurityConfiguration` autentica rutas por defecto, pero cada caso de uso debe imponer el alcance de equipo.
- Brechas Frontend: el cambio de empresa con objeto no invalida de modo fiable estado/caché de usuarios; en estado vacío un supervisor ve CTA de invitación; el diálogo de asignación no distingue 403/409/422 y no resuelve territorios activos vacíos.

## Distribución de sprints confirmada

INT-033 pertenece al Sprint 2 y su mapa de dependencias sólo exige `BE-011`, `BE-058`, `BE-059`, `FE-004` y `FE-006`. Clientes/cartera son productores de Sprint 2, pero su validación vertical completa está en `INT-005` e `INT-034`. Rutas se planifican en Sprint 4 (`BE-061`, `FE-014`, `INT-007`); tracking en Sprint 5 (`BE-029`–`BE-031`, `FE-020`, `INT-011`); recorrido histórico en Sprint 6 (`BE-032`, `INT-012`); visitas en Sprint 7 (`BE-040`, `INT-016`); ventas/reportes por vendedor o cliente en Sprint 8 (`BE-048`/`BE-049`, `INT-020`/`INT-021`); dashboard/exportación en Sprint 9 (`BE-047`/`BE-050`, `INT-022`/`INT-040`).

Por planificación, INT-033 valida ahora identidad, invitación/activación, asignación/reasignación, listados de vendedores y el alcance disponible de clientes/cartera. Las superficies no producidas se difieren a sus integraciones verticales y deberán incorporar el mismo control de alcance al implementarse.

## Evidencia y decisión aplicada

OpenAPI: `docs/api/openapi.yaml` (`/sellers`, `/territories`, tracking, rutas, visitas y reportes). Backend: `workforce/application/SellerService`, `customers/.../PortfolioAccessScopeService`, `identityaccess/config/SecurityConfiguration`.

La distribución de sprints resuelve la delimitación: no se implementarán superficies futuras dentro de INT-033. Development corrigió el aislamiento de estado Frontend, el modo de sólo lectura y los estados de asignación; además añadió evidencia HTTP de alcance de cartera para supervisor. QA, Seguridad y DoF aprobaron el mismo candidato. Véanse los handoffs de Development, QA, Seguridad y DoF.
