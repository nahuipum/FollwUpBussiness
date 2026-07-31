# DoF — EN-016

## Estado

`PASS`

## Historia y alcance

`EN-016 — Definir privacidad, retención y rastreo`. Cierre documental del diff de política, ADR y contratos futuros; no valida las implementaciones posteriores.

## Rutas revisadas

- Historia, ADR-016 y ADR-015.
- Contrato principal/espejo, OpenAPI, WebSocket y `location-offline-contract`.
- Matriz EN-016, baseline/threat model y handoffs de Desarrollo, QA y Seguridad.
- Diff actual sobre `HEAD 3fdf6728f3e2c5734610bb866bab7aa684f15dd8`.

## Criterios

Los CA1–CA6 y las decisiones D1–D12 tienen trazabilidad documental a ADR-016, contratos y matriz. Los contratos OpenAPI, WebSocket y offline son consumibles para Backend, Frontend y Mobile; QA y Seguridad independientes informan `PASS` documental para el mismo snapshot de trabajo.

## Decisiones y responsables

D1–D12 opción A constan como aceptadas el 2026-07-31 por Luis Siancas en Producto, Legal/Privacidad y Seguridad. Los pendientes declarados mantienen responsable y fecha; las historias ejecutoras conservan sus gates propios.

## Evidencia y comandos

- Snapshot verificable: `HEAD 3fdf6728f3e2c5734610bb866bab7aa684f15dd8` más worktree EN-016; manifiesto de 14 fuentes con SHA-256 `c5accd84be2a85df1389fa882ea4ca362aaf360802bb371d63b4c3b3878c30d0`.
- `git diff --check`: PASS.
- Handoffs de Desarrollo `READY_FOR_HANDOFF`, QA `PASS` y Seguridad `PASS` corresponden al mismo cierre documental. CI/runtime: no aplicable al diff documental sin código, dependencias, infraestructura, migraciones ni ejecución desplegable.

## Hallazgos y riesgos

No se registran hallazgos QA o de Seguridad abiertos dentro del diseño documental. Los riesgos runtime, rollback operativo y las pruebas de controles quedan asignados a las historias desbloqueadas, sin trasladar esta aprobación a sus implementaciones.

## Pendientes y siguiente autorizado

No hay pendientes que bloqueen EN-016. Siguiente autorizado: implementar y validar de forma independiente los controles acordados en BE-028/029/032/034/054, FE-020/022, MOB-003/026/030 e INT-031.
