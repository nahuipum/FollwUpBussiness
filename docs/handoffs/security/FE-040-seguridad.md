# FE-040 — Revisión de Seguridad

- Veredicto: `PASS`
- Candidate-ID: `505cc45 + worktree FE-040 7ae5fd29`; `HEAD 505cc45` y la firma rápida del worktree coinciden con los handoffs Dev/QA.

## Superficie revisada

- Autorización UI para `PLATFORM_SUPERADMIN`, selección de empresa desde la fila, `PATCH` de estado, payload, tratamiento de respuesta obsoleta y limpieza ante cambio de sesión/empresa.
- Código/pruebas: `PlatformCompaniesPage.tsx`, `api.ts`, `types.ts`, `CompanyTable.tsx`, `CompanyActionDialog.tsx`, `api.test.ts` y `PlatformCompaniesPage.test.tsx`.

## Controles y evidencia

- `PASS`: el menú de estado solo se presenta con `PLATFORM_SUPERADMIN`; sigue siendo una ayuda de UI y no sustituye autorización del servidor.
- `PASS`: el recurso procede de `company.id`, se codifica en la ruta y el body contiene exclusivamente `status` y `reason`; no hay `tenantId` ni actor manipulable.
- `PASS`: no se observan secretos, logs, cache ni almacenamiento local del motivo o datos de empresa.
- Abuso reproducido: se dejó un `PATCH` pendiente, se cambió a otra sesión/empresa y luego se resolvió con `200`. Resultado: 1/1 prueba correcta; diálogo y envío se limpiaron, y la respuesta tardía no mutó la vista.
- `NOT_EXECUTED`: no se repitió la suite completa; se reutiliza QA `PASS` (17/17).

## Hallazgos y riesgo residual

Sin hallazgos explotables en el delta. Riesgo residual: la autorización efectiva y el aislamiento entre empresas dependen del Backend; no fueron revalidados por el alcance de esta fase.

No aplican WebSocket, Redis/cache, mensajería, archivos, dependencias ni infraestructura.
