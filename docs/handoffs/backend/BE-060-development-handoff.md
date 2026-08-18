# BE-060 — Desarrollo Backend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD 5a14588 + 9cd20799ef97`.

## Alcance

Se corrigió la idempotencia concurrente de lote en `CustomerPortfolioAssignmentService` y `JdbcCustomerPortfolioStore`: reserva atómica `PENDING` por tenant/clave, replay completo al finalizar y `409` ante carga distinta. La transacción revierte reserva y efectos ante fallo. Se ajustó el historial para registrar reasignación `A→B` en una sola transición; colecciones se emparejan determinísticamente y las altas/bajas sobrantes conservan el modelo EN-021.

## Archivos y migración

Puerto/persistencia: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/application/port/out/CustomerPortfolioStore.java`, `.../adapter/out/persistence/JdbcCustomerPortfolioStore.java`. Migración nueva: `.../db/migration/V32__add_customer_portfolio_assignment_idempotency_status.sql`. Pruebas: `.../CustomerPortfolioAssignmentServiceTest.java`, `.../CustomerPortfolioReadIntegrationTest.java`.

## Evidencia y criterios

- Focalizadas (concurrencia, replay, conflicto, tenant/autorización y transición A→B): `PASS`.
- `HexagonalArchitectureTest,ModuleBoundaryTest`: `PASS`.
- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" clean verify`: `PASS`.
- `git diff --check HEAD`: `PASS`.

No se modificaron contratos/rutas ni se identifican riesgos residuales. Reproducción: ejecutar los comandos anteriores desde `backend/followupbussiness`.
