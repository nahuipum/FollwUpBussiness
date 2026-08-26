# BE-061 — QA handoff

**Estado:** `PASS`  
**Candidate-ID verificado:** `eddddca+98a900eb8d8b` — coincide con `HEAD`, `git diff | git hash-object --stdin`, el paquete y el handoff de Development.

## Mapeo y evidencia

- Remediación SEC-BE061-01: `ReadRoutesService.get` usa `findAuthorized`; `JdbcRouteStore.findAuthorized` trae cabecera y puntos en una consulta filtrada por `tenantId`, vendedores autorizados y `PUBLISHED` para vendedor. Ya no existe la secuencia cabecera autorizada → detalle independiente.
- Negativo TOCTOU/BOLA: `ReadRoutesServiceTest.sellerReturnsNeutralNotFoundWhenRouteChangesAfterPreviouslyAuthorizedHeader` simula que la ruta ya no pertenece a A y exige `404` neutro; verifica que no se invocan `findHeader` ni `find`.
- Regresión afectada: el caso vendedor propio `PUBLISHED` sigue recuperando puntos mediante la única lectura autorizada.

## Comandos/evidencia

- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=ReadRoutesServiceTest' test` — PASS.
- Se reutiliza `clean verify` del candidato base; el delta no toca composición, migración ni configuración.

## Hallazgos

Sin hallazgos abiertos en la remediación.

## Riesgo de regresión y residual

No se observa la fuga TOCTOU/BOLA reportada en SEC-BE061-01. Permanece el riesgo operativo de `V50` ante duplicados históricos `PUBLISHED`.
