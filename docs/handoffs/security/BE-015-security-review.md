# BE-015 — Revisión de Ciberseguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD ef3804e + diff da53191e`

## Superficie revisada

`POST /customers/duplicate-checks`: autorización, BOLA/IDOR, aislamiento multiempresa, enumeración mediante nombre/documento/teléfono/dirección/coordenadas y `excludeCustomerId`, exposición de PII/ubicación, errores, caché, logs y efectos secundarios. La firma del candidato coincide con el paquete y QA (`PASS`).

## Hallazgos y evidencia

Sin hallazgos reproducibles. `PASS`: `CheckCustomerDuplicatesService` acepta únicamente `COMPANY_ADMIN`, obtiene `tenantId` sólo de `AuthenticatedActor` y deniega antes de invocar el store; `SUPERVISOR` queda incluido en esa denegación por comparación cerrada de rol. `JdbcCustomerStore.findDuplicateMatches` parametriza entradas y aplica `tenant_id=?` a todos los criterios; un `excludeCustomerId` ajeno no revela existencia ni modifica candidatos del tenant. `score` y `matchedFields` se calculan sólo sobre filas ya aisladas. Los errores 403/422 son genéricos y la correlación no contiene datos de entrada. No se añadieron logs; el flujo sólo usa `SELECT`, sin escrituras, auditoría, eventos, colas, Redis ni archivos. La cadena Spring exige autenticación/CSRF y conserva cabeceras de no-caché predeterminadas.

## Abuso reproducido

`PASS`: prueba PostGIS focalizada con coincidencia completa de PII/ubicación en otro tenant y UUID foráneo como exclusión; retornó sólo el cliente propio. Comando: `mvn -q '-Dtest=JdbcCustomerStoreDuplicateCheckIntegrationTest#usesPostgis100MeterRadiusAndNeverReturnsOtherTenantOrExcludedCustomer' test` (1 prueba, exit 0).

## Controles no aplicables y riesgo residual

Secretos, WebSocket, pagos, dependencias e infraestructura: no modificados. Riesgo residual: `clean verify` continúa `NOT_EXECUTED`; completar CI equivalente antes del release.
