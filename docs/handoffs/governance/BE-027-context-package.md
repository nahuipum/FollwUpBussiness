# Paquete de contexto — BE-027 Sugerir clientes por frecuencia

**Estado actual:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `37da94f + 8b164f2` (HEAD + digest del diff BE-027 de Development, recalculado tras la remediación).

## Alcance confirmado

`GET /routes/suggested-customers` requiere `CorrelationId`, `sellerId`, `date`, paginación y los roles `COMPANY_ADMIN`/`SUPERVISOR` (`docs/api/openapi.yaml`). El tenant, identidad, rol y equipo proceden de sesión. La consulta debe ser de solo lectura, con alcance previo a filtros/conteo/paginación, sin auditoría de cambio, eventos ni exposición de PII en observabilidad.

Invariantes preparados: éxito reproducible/explicable para vendedor autorizado; denegación cross-tenant o fuera de equipo sin filtración; exclusión de cliente, vendedor, cartera o territorio inactivo/no autorizado; consulta sin mutaciones; correlationId y métricas sin PII, direcciones, coordenadas ni payloads.

## Regla MVP aprobada

1. **Última visita válida:** el hecho público `last_completed_visit_at`; visitas anuladas, fallidas, en curso, fuera de ruta o corregidas que no se materialicen como completadas no cuentan. Es extensible: futuros productores actualizan ese hecho sólo cuando el estado de negocio sea `COMPLETED`.
2. **Sin visita:** se sugiere desde su primer día operativo, con vencimiento igual a la fecha de alta del cliente en `America/Lima`; si `date` es anterior a esa fecha no se sugiere. Razón estable: `SIN_VISITA_PREVIA`.
3. **Fecha:** comparar fechas calendario inclusivas en `America/Lima`: `dueDate = lastCompletedVisit en Lima + visitFrequencyDays`; es vencido cuando `date >= dueDate`. Lima queda temporalmente fijada; el diseño debe encapsular la zona para sustituirla por la configuración IANA de empresa al internacionalizar.
4. **Prioridad y razón:** prioridad positiva determinista = `1 + días completos de atraso` (mínimo 1); para nunca visitado, `1 + días desde la fecha de alta hasta date`. Orden: prioridad descendente, `dueDate` ascendente y `customerId` ascendente. Razones cerradas: `FRECUENCIA_VENCIDA` y `SIN_VISITA_PREVIA`; no incluir PII ni texto libre.
5. **Zona/territorio:** el cliente debe tener `territoryId` activo del tenant y dicho ID debe estar en los territorios activos asignados al vendedor activo solicitado. Además debe pertenecer a su cartera vigente; relaciones múltiples se resuelven por pertenencia, no por preferencia. Sin territorio o sin intersección se excluye.
6. **Frecuencia:** sólo `visitFrequencyDays` entero 1..365. Nula/inválida se excluye. Una modificación usa inmediatamente el valor vigente para la siguiente consulta; no se recalcula ni reescribe historial.

Fuentes revisadas: `docs/stories/backend/BE-027-sugerir-clientes-por-frecuencia.md`, `docs/functional/contrato-funcional.md` (RF-RUT-011, RNF-016), `docs/api/openapi.yaml`, `docs/handoffs/governance/EN-021-context-package.md`, `docs/handoffs/governance/BE-060-context-package.md`, y el hecho público existente `last_completed_visit_at`.

## Delta Development

### Remediación SEC-BE027-001

Antes de autorización o cualquier consulta a Workforce/Clientes, la validación calcula el offset como `long` y rechaza con `Invalid` los valores fuera del rango indexable. El controlador ya traduce `Invalid` a 400 neutral con `correlationId`, sin datos parciales, escrituras, auditoría ni eventos. La regresión cubre `page=107374183&pageSize=20` y verifica cero interacciones con los puertos. Maven focalizado PASS (4 pruebas); `git diff --check` PASS.

Implementado `GET /routes/suggested-customers`: autoriza rol/tenant/vendedor/equipo antes de consultar, exige cartera vigente y territorios activos, lee sólo `last_completed_visit_at`, aplica las seis reglas MVP con zona `America/Lima`, orden y paginación estables. No hay migración, escrituras, auditoría ni eventos. Validación: focalizadas y arquitectura PASS; `mvn '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -q clean verify` PASS.
