# EN-021 — Revisión de Ciberseguridad

**Estado:** `PASS`  
**Candidate-ID:** `f31ec28+981fc69ba1af`

## Superficie y evidencia

Se revisaron `GET /customers`, alcance `COMPANY_ADMIN`/`SUPERVISOR`/`SELLER`, cartera/actividad PostgreSQL, filtros, conteo, paginación, V29/V30 y PII/ubicación.

- Tenant sólo procede de `AuthenticatedActor`; no existe parámetro público equivalente.
- Supervisor/Seller resuelven vendedores activos del tenant antes de filtros; `count` y `list` comparten la cláusula tenant→cartera vigente.
- Abuso reproducido: `CustomerPortfolioReadIntegrationTest#rejectsCrossTenantAndInactiveOrUnknownSellerFiltersAndHandlesAbsentActivityAtInclusiveDates` — `PASS`. IDs ajenos, inactivos o desconocidos obtienen la misma denegación sin lectura filtrada.
- SQL parametrizado; errores REST genéricos sin IDs, PII, ubicación o totales. No hay caché ni ruta alternativa por paginación.
- Se reutilizan QA focalizada, arquitectura, `clean verify` y `git diff --check`: `PASS`.

## Hallazgos

Sin hallazgos abiertos. No se observó BOLA/IDOR ni filtración por resultados, conteos, errores, caché o ramas temporales distinguibles.

No cambiaron secretos, Redis, mensajería, archivos, dependencias ni infraestructura. Riesgo residual: productores de visitas/compras y mutación de cartera se revisarán en sus historias posteriores. Condición de cierre satisfecha: conservar el Candidate-ID y aplicar alcance antes de filtros/conteo/paginación.
