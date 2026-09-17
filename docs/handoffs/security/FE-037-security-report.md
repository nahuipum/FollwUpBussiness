# FE-037 — Reporte final de Seguridad

**Estado:** PASS  
**Candidate-ID:** `574be0e+dde667d7`

## Superficie revisada

- Autorización `COMPANY_ADMIN`/`SUPERVISOR`; sesión, empresa y descarte de respuestas obsoletas.
- Lectura y mutaciones `/territories`: bearer en memoria, CSRF, guardas de doble envío y `If-Match`/`version`.
- Estados 403/404/409/422/genérico, correlation ID, borrador y confirmación de inactivación con preservación histórica.
- Diff de producción de Zonas y primitives compartidos; contratos y dependencias no cambiaron.

## Resultado y evidencia

- **PASS — autorización/tenant:** `CompanyTerritoriesPage` solo expone creación, acciones y formulario a `COMPANY_ADMIN`; `TerritoryTable` omite la columna de acciones para `SUPERVISOR`. `useTerritories` invalida datos y solicitudes al cambiar la clave de sesión/empresa; `useTerritoryForm` invalida mutaciones pendientes. El transporte aborta generaciones de sesión anteriores.
- **PASS — mutaciones:** POST/PATCH conservan `getSessionMutationAuthorization()`; PATCH codifica el id y envía `If-Match` desde `territory.version`. Los rechazos permanecen locales, conservan el formulario y solo muestran correlation IDs normalizados.
- **PASS — abuso reproducido:** dos envíos inmediatos durante un POST pendiente ejecutaron una sola mutación. Comando: `npm run test -- src/features/company-territories/hooks/useTerritoryForm.test.tsx -t "descarta un segundo envío mientras la mutación está pendiente"` — 1/1 PASS.
- QA previo del mismo candidato: **PASS**; se reutilizó su cobertura de solo lectura y 422. Sin hallazgos Critical/High/Medium/Low.

## No aplicable y riesgo residual

No aplican cambios de secretos, ubicación/PII nueva, almacenamiento local, WebSocket, Redis/cache, mensajería, archivos, dependencias o infraestructura. **NOT_EXECUTED:** no se reejecutó backend ni la matriz visual completa; no hay diff backend y QA ya validó el candidato. Riesgo residual bajo: la autorización frontend es defensa en profundidad; la denegación autoritativa continúa dependiendo del backend sin cambios.
