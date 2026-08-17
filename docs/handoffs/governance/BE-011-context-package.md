# Paquete canónico — BE-011 Asignar supervisor

## Estado y predecesoras

- Estado actual: `READY_FOR_HANDOFF`; Candidate-ID: `a361343 + BE-011/d2c022eeadfe` (fijado una sola vez tras Development).
- BE-058: DoF `PASS` en `docs/handoffs/governance/BE-058-dof.md`; contrato estable de usuarios de empresa, roles y estados.
- BE-059: DoF `PASS` en `docs/handoffs/dof/BE-059-dof.md`; lectura de vendedores y alcance por equipo vigente disponibles.

## Contrato y alcance cerrado

- Implementar exclusivamente `PUT /sellers/{sellerId}/supervisor` de `docs/api/openapi.yaml`: sólo `COMPANY_ADMIN`, `AssignSupervisorRequest.supervisorId` UUID o `null`, respuesta `Seller`, y códigos `200/400/403/404/422` ya definidos. No modificar el contrato silenciosamente.
- El tenant y actor proceden únicamente de la sesión. Vendedor y supervisor deben existir dentro de ese tenant; supervisor debe tener rol `SUPERVISOR` y estar activo. `null` retira explícitamente la relación.
- La autorización de `GET /sellers` para `SUPERVISOR` debe consultar la relación vigente, sin caché/grant/filtro que amplíe acceso. Tras asignar, retirar o reasignar, el equipo refleja el estado inmediato; el supervisor previo queda revocado.
- Excluye alta/edición/estado de usuarios o vendedores, territorios/rutas/cartera, eliminación o reescritura de históricos, nómina y asistencia.

## Invariantes de control

1. Actor/recurso: únicamente `COMPANY_ADMIN` de sesión; `SUPERVISOR`, `SELLER`, anónimo, plataforma y demás roles reciben rechazo sin llegar a escrituras.
2. Éxito: relación tenant-scoped, supervisor activo/rol correcto; auditoría append-only con actor, vendedor, supervisor previo/nuevo, motivo técnico mínimo y `correlationId`, sin PII completa ni secretos.
3. Denegación: IDs cross-tenant, vendedor inexistente, usuario no supervisor o inactivo y body inválido respetan contrato; sin relación, eventos/auditoría o cambios de alcance.
4. Conflicto/reintento: operación repetida o concurrente no debe ampliar/revocar acceso erróneamente ni duplicar efectos auditables; preservar datos operativos e historia.
5. Fallo/rollback: fallo de persistencia/auditoría deja intacta relación, autorización efectiva y eventos; logs sólo resultado/error no sensible y correlación.

## Puertos y pruebas esperadas

Puertos alcanzables: caso de uso de supervisor/vendedor, consulta durable de usuario/rol/estado, persistencia de relación de equipo, consulta de equipo de BE-059, auditoría/observabilidad y adaptador REST/autenticación. Enumerarlos y justificar cualquier adicional en handoff.

Development debe añadir pruebas focalizadas de éxito, retirada/reasignación, tenant, rol/estado, denegaciones y ausencia de efectos. Por tocar autorización, persistencia/transacción y auditoría, ejecutar focalizadas y `mvn -q clean verify` (informar bloqueo de infraestructura si ocurre). No hacer commit.

## Secuencia

Development produce `docs/handoffs/backend/BE-011-development-handoff.md` (`READY_FOR_HANDOFF` o `BLOCKED`) y luego se fija una vez Candidate-ID. QA, Seguridad y DoF usan ese candidato y sus artefactos, sin releer fuentes salvo riesgo o contradicción documentada.
