# BE-054 — Handoff Desarrollo Backend

## Estado

`READY_FOR_HANDOFF`

## Candidato y alcance

- Candidate-ID: `HEAD 66c8cf2 + diff 64302b321019`.
- Implementado `/company/settings`: GET para `COMPANY_ADMIN`/`SUPERVISOR`/`SELLER` y PATCH exclusivo de `COMPANY_ADMIN`, siempre acotado al `tenantId` del actor autenticado.
- PATCH exige `X-Correlation-Id` e `If-Match`; el almacenamiento condiciona la versión y ejecuta cambio+auditoría en una transacción. Devuelve ETag; versión obsoleta produce 409 sin escritura.
- `geofenceRadiusMeters`, `trackingIntervalSeconds` y `locationRetentionDays` se rechazan con 422 por mera presencia JSON, incluso `null`, antes de evaluar `If-Match`, sin lectura, mutación ni auditoría. Configuración activa ausente responde 403 neutral; no se alteraron constantes, contrato ni migraciones.
- El adaptador incrementa una sola vez `company.settings.rejected`, sin tags ni datos sensibles, para body vacío, ETag inválido y JSON ilegible; rechazos del caso de uso se contabilizan allí.
- Por decisión MVP, `saleEditWindowMinutes` acepta exclusivamente nodo JSON integral 0–10080. Decimal, `null`, string, booleano, objeto, arreglo y fuera de rango dan 422 antes de lectura, escritura o auditoría, sin coerción, redondeo ni valor por defecto.

## Archivos

- Adaptador/puertos/servicio/persistencia: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/.../CompanySettings*` y `TenancyConfiguration.java`.
- Pruebas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/application/CompanySettingsServiceTest.java` y `.../adapter/in/rest/CompanySettingsControllerTest.java`.
- Sin migraciones ni cambios OpenAPI.

## Verificación y criterios

- PASS `mvn -q '-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest' test`; PASS `git diff --check`.
- Se conserva `mvn -q clean verify` PASS del candidato previo; la remediación se validó focalmente.
- Cubiertos: aislamiento de tenant/rol, campos fijos nulos/no nulos con ETag obsoleto sin efectos, 409 para mutable obsoleto, 422 HTTP y contador seguro. `saleEditWindowMinutes` inválido no invoca el caso de uso; el servicio replica el rechazo previo a efectos.

## Riesgo y reproducción

- Riesgo residual: QA y Security deben revalidar este candidato. Reproducir PATCH autenticado con `saleEditWindowMinutes:1.9` (o `null`, string, booleano, objeto, arreglo, -1, 10081): devuelve 422 y una sola métrica, sin efectos.
