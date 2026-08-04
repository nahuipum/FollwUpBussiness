# Security review — BE-056

## Estado

`BLOCKED`

## Snapshot y superficie revisada

- Rama: `feature/be-056-dlq`, diff de BE-056 aún sin commit.
- Superficie: DLQ durable PostgreSQL, transición/retención SQL, endpoint interno
  de reproceso, Spring Security, RabbitMQ, métricas/alertas y OpenAPI.
- Gates previos: Desarrollo `READY_FOR_HANDOFF`; QA independiente `PASS` en
  `docs/handoffs/backend/BE-056-backend-qa.md`.

## Hallazgos

| ID | Severidad | Estado | Evidencia y escenario de abuso | Remediación |
|---|---|---|---|---|
| SEC-BE056-01 | High si el endpoint se habilita sin cerrar la frontera | BLOCKED | `SecurityConfiguration` solo consume un `Authentication`; no hay filtro/provider/conversor JWT ni resource server. Las pruebas usan principal y rol sintéticos. Hoy el endpoint falla cerrado para tráfico real, pero no hay evidencia de que un `PLATFORM_SUPERADMIN` real tenga firma, sesión activa, `sub` UUID y autoridad persistida válidos. Al incorporar autenticación sin prueba integrada, un rol mal mapeado o principal no confiable podría reencolar eventos de cualquier tenant. | Mantener el endpoint no liberado hasta BE-003/adaptador Auth runtime. Añadir prueba integrada con el mecanismo aprobado: firma/sesión activa, `sub` UUID, rol exacto, y rechazo de rol/tenant manipulados. |
| SEC-BE056-02 | Medium | OPEN | El límite de tres acciones es por `eventId`; no hay límite por operador/origen. Con una sesión privilegiada comprometida se pueden emitir solicitudes masivas contra PostgreSQL o reencolar muchos eventos. | Rate limit distribuido por operador/origen, respuesta 429, presupuesto operativo y prueba de abuso. |
| SEC-BE056-03 | Medium | OPEN | La DLQ guarda solo el último operador/instante; una acción posterior sobrescribe la atribución y no existe auditoría append-only por reproceso. | Auditoría append-only por acción: `eventId`, operador técnico, instante y resultado, sin payload/PII. |

## Controles verificados

- El cliente no aporta tenant, payload, correlationId ni identidad de operador;
  la DLQ conserva tenant y correlación desde la fila durable.
- Path UUID parametrizado, rol exacto requerido, usuarios de tenant sin acceso;
  no se observa BOLA en la frontera propuesta.
- CTE, FK, leases, límite de ocho intentos, máximo tres reprocesos y reingreso a
  DLQ preservan semántica al menos una vez y no forman bucle automático.
- Error permanente/no enrutable llega a DLQ; transitorio tiene backoff limitado.
- Logs y métricas no contienen payload ni PII; alertas de profundidad/edad DLQ
  existen. Secretos Rabbit se obtienen por entorno; puertos siguen restringidos.

## Verificaciones y limitaciones

- `SecurityConfigurationTest`: PASS (30 pruebas con principal sintético).
- `git diff --check`: PASS.
- Evidencia QA del mismo snapshot reutilizada: PostgreSQL/Testcontainers,
  promtool, ciclo de reproceso y arquitectura en PASS.
- RabbitMQ least-privilege runtime y autenticación real: `NOT_EXECUTED`; no hay
  cambio de dependencias ni de credenciales en BE-056.

## Riesgo residual y condición de desbloqueo

No hay bypass reproducible mientras el endpoint permanezca fail-closed. No
obstante, BE-056 no puede declarar operación de operador ni pasar DoF hasta que
BE-003 provea una identidad runtime verificable y se cierren SEC-BE056-02 y
SEC-BE056-03. La alternativa de relajar el endpoint o confiar en datos del
cliente queda rechazada por aislamiento multiempresa y ADR-010.
