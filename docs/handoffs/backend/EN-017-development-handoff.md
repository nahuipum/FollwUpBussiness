# EN-017 — Desarrollo documental y contrato

**Estado:** `READY_FOR_HANDOFF`

## Alcance y evidencia de criterios

| Criterio EN-017 | Evidencia documental | Verificación futura requerida |
|---|---|---|
| 1. Identidad separada de push | ADR-017, límites y puertos; contrato, límites | contrato de puerto y ausencia de dependencia cruzada |
| 2. Dispositivo, rotación y revocación | ADR-017, instalación; contrato, registro | tenant/usuario derivado, upsert, rotación, logout y revocación |
| 3. Pantalla bloqueada segura | ADR-017, privacidad; contrato, entrega | payload genérico y prueba negativa de PII/ruta/enlace |
| 4. Reintentos, TTL, dedupe, métricas y fallback | ADR-017, entrega/operación; contrato, envelope/entrega | outbox, concurrencia, DLQ, TTL 24 h, degradación y `route.*` registrado |
| 5. Secretos, costos, cuotas y ambientes | ADR-017, operación; contrato, seguridad | secretos fuera de repo, sandbox, cuotas, alertas y rollback |
| Seguridad Fase 3 | ADR-017/ADR-008, contrato y OpenAPI | DELETE neutral, guardas atómicas, validación de evento/binding y trabajo identidad cifrado |

## Archivos y contratos

- `docs/architecture/adr/ADR-017-canales-notificacion.md`
- `docs/events/notification-contract.md`
- `docs/events/event-catalog.yaml` — `route.published` v1 enriquecido sin
  cambiar su versión ni crear productor; registra además `route.assigned`,
  `route.modified` y `route.reassigned` v1 para RF-RUT-007/BE-053.
- `docs/api/openapi.yaml` — se conserva `/devices`; se concilia su request
  canónico y se hace idempotente el `DELETE`.
- `docs/architecture/adr/ADR-008-autenticacion-sesiones.md` — puente seguro
  del ticket de logout MOBILE hacia revocación de instalaciones.

No hay endpoint nuevo, SDK, código, migraciones ni cambios de esquema. El
ajuste OpenAPI solo precisa el comportamiento ya trazado de `/devices`.

## Verificación ejecutada

- `git diff --check` — PASS sobre el diff final rastreado.
- `npx --yes @redocly/cli lint docs/api/openapi.yaml` — PASS tras la
  remediación de Seguridad.
- `npx --yes prettier --check docs/events/event-catalog.yaml` — PASS tras el
  retest de Seguridad.
- `rg -n '[ \t]+$' ...` sobre los cuatro archivos de EN-017 — PASS, sin
  whitespace final.
- Validación YAML con PyYAML — no ejecutable: el intérprete disponible no tiene
  el módulo `yaml`; el YAML se limita a escalares/listas anidadas revisadas en
  el diff. La CI deberá ejecutar el validador YAML configurado por el proyecto.
- Remediación Fase 3 Mobile: request REST canónico, enum, campos desconocidos,
  revocación idempotente y logout con ticket — cubiertos documentalmente;
  pendiente de revisión Mobile independiente.
- Remediación Fase 3 Backend: los cuatro tipos `route.*` v1 están registrados,
  versionados y mapeados al envelope/dedupe; ninguna modificación o
  reasignación debe inventar un evento fuera del catálogo.
- Remediación Seguridad: DELETE neutral para bindings ajenos, guardas con
  ámbito completo y atomicidad, validación de envelope/binding/token y trabajo
  de identidad cifrado/latest-wins — cubiertos documentalmente; requiere nueva
  revisión independiente de Seguridad.
- Retest de Seguridad: catálogo y evidencias de consumibilidad alineados con
  dedupe `tenantId + eventId + recipientTechnicalId + notificationType` y
  DELETE neutral también para dispositivo ajeno.

## Riesgos y siguientes pasos autorizados

Riesgo residual: implementación futura debe probar aislamiento multiempresa,
autorización por recurso, secreto/token protegido, al-menos-una-vez,
revocación, TTL y degradación. QA y Seguridad son obligatorios por identidad,
secreto, datos de dispositivo, RabbitMQ y notificaciones.

Siguiente trabajo autorizado: revisión independiente del ADR/contratos y,
después, las historias BE-006, BE-053 y MOB-029 dentro de sus alcances. Este
handoff no autoriza proveedor nominal, endpoints ni productores/consumidores.
