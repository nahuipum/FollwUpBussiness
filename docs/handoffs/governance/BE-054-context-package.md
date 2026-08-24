# BE-054 — Paquete de contexto

## Estado y candidato

- Fase: DoF completado — `PASS`.
- Candidate-ID: `HEAD 66c8cf2 + diff 64302b321019`.
- Alcance: configuración operativa tenant-bound; autorización, concurrencia, auditoría y uso de parámetros en validaciones nuevas. Excluye mobile, tracking vivo, WebSocket, mapas y validación completa de visitas.

## Decisión vigente y contradicción registrada

ADR-016 y OpenAPI fijan en MVP `geofenceRadiusMeters=100`, `trackingIntervalSeconds=60` y `locationRetentionDays=90`; la geocerca se calcula solo en Backend/PostGIS. No hay proveedor externo. La historia original aún expresa «ajustar radio y frecuencia» y el esquema PATCH incluye esos campos `const`; se interpreta según la decisión vigente: el PATCH rechaza con 422 cualquier presencia/intento de actualización de esos tres campos, sin mutación ni auditoría de cambio. Cambiarlos requiere ADR sustituto; no modificar contrato ni constantes para habilitarlo.

## Invariantes y controles

- Lectura: `COMPANY_ADMIN`, `SUPERVISOR`, `SELLER`; escritura: solo `COMPANY_ADMIN`.
- Tenant únicamente desde sesión; no aceptar `tenantId` para autorización, consulta o persistencia.
- Éxito: configuración del tenant, consistente y versionada; PATCH exige `CorrelationId` e `If-Match` y es atómico.
- Denegación: 403 y ninguna lectura/cambio para rol o tenant ajeno. Conflicto: `If-Match` obsoleto da 409 sin sobrescritura. Rechazo de payload, fijos, formato o rango: 422 sin mutación.
- Auditoría/observabilidad: solo cambios efectivos; actor, tenant, tipo, timestamp y correlationId; no payload íntegro, coordenadas, tokens, secretos o PII. Evento/métrica seguro para actualización, rechazo y conflicto.
- Aplicación: validaciones nuevas resuelven desde fuente backend autorizada, nunca valores recibidos desde mobile; no reinterpretar historial.

## Referencias ubicadas

- Historia: `docs/stories/backend/BE-054-configurar-geocerca-y-tracking.md`.
- Contrato: `docs/api/openapi.yaml`, `/company/settings` (696), esquemas (3254–3275).
- Decisión y privacidad: `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`; `docs/stories/enablers/EN-016-definir-privacidad-retencion-y-rastreo.md`.
- Auditoría previa: `docs/handoffs/backend/BE-051-development-handoff.md` y artefactos homónimos.

## Desarrollo esperado

Localizar con `rg` endpoint/settings, entidad, ETag/If-Match, tenant context, autorización, auditoría BE-051 y consumidores. Respetar hexagonal. Pruebas dirigidas más `mvn clean verify` por composición compartida. Escribir `docs/handoffs/backend/BE-054-development-handoff.md` (máx. 300 palabras, español) y actualizar este paquete con Candidate-ID y estado `READY_FOR_HANDOFF` o `BLOCKED`.

## Delta de Desarrollo

- Se abrió `docs/api/openapi.yaml` en `/company/settings` y sus esquemas porque el endpoint contractual no tenía adaptador Backend: nueva superficie que requería confirmar ruta, roles y precondiciones.
- Implementados GET/PATCH tenant-bound, versión/ETag e `If-Match`, rechazo 422 de los tres campos fijos y transacción configuración+auditoría. Métricas seguras: `company.settings.updated`, `.rejected`, `.conflicts`.
- Sin migración ni modificación contractual: las columnas y valores fijos ya existían.
- Evidencia: `mvn -q '-Dtest=CompanySettingsServiceTest,CompanyControllerTest' test` y `mvn -q clean verify` PASS; `git diff --check` PASS.

## Delta QA

- `PASS` tras remediación: campo fijo con valor no nulo precede a `If-Match`; MockMvc cubre 422 y ausencia de configuración con 403 neutral.

## Delta Security

- `CHANGES_REQUIRED`: los campos fijos presentes con `null` no se distinguen de omitidos y evaden el 422; además, los 422 producidos en el controlador no incrementan `company.settings.rejected`. La reproducción del campo fijo no nulo más ETag obsoleto pasó sin efectos. Requiere remediación Dev y revalidación QA; no iniciar DoF.

## Delta Security final

- `CHANGES_REQUIRED`: PASS las dos remediaciones previas (campo fijo `null` con `If-Match` devuelve 422 sin efectos/auditoría; rechazos del adaptador incrementan contador seguro una vez). Nuevo riesgo: `integer(JsonNode)` trunca decimales; `saleEditWindowMinutes:1.9` puede persistirse como `1` en lugar de 422. Se alcanzó el límite operativo de ciclos; no iniciar DoF. Cierre: validar nodo integral, prueba de 422 sin efectos y revalidación QA/Security sobre un nuevo Candidate-ID.

## Delta Security final de coerción

- `PASS`: `saleEditWindowMinutes` exige entero JSON 0–10080; la reproducción con `1.9` e `If-Match` devuelve 422, no invoca caso de uso ni produce lectura/escritura/auditoría e incrementa una vez `company.settings.rejected` sin tags ni datos sensibles. No quedan hallazgos Security abiertos; procede DoF.

## Delta de remediación de coerción

- Por decisión MVP, `saleEditWindowMinutes` solo acepta nodo JSON integral entre 0 y 10080. Decimal, `null`, string, booleano, objeto, arreglo y fuera de rango devuelven 422 antes de invocar el caso de uso; no hay lectura, escritura, auditoría ni valor por defecto.
- El caso de uso también rechaza valor marcado como presente e inválido antes de lectura. Cada rechazo del adaptador incrementa exactamente una vez `company.settings.rejected`, sin tags ni datos sensibles.
- PASS `mvn -q '-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest' test`; `git diff --check` PASS.

## Delta de remediación Security

- El adaptador conserva presencia JSON de los tres campos fijos mediante banderas explícitas hacia el caso de uso: `null` y valor no nulo dan 422 antes de lectura/versionado, sin mutación ni auditoría.
- `company.settings.rejected` incrementa exactamente una vez, sin tags, para body vacío, `If-Match` inválido y JSON ilegible generados por el adaptador. Los rechazos del caso de uso siguen siendo instrumentados allí, sin doble conteo.
- Pruebas focalizadas PASS: `mvn -q '-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest' test`; `git diff --check` PASS.

## Delta QA

- `CHANGES_REQUIRED`: con `If-Match` obsoleto y cualquier campo fijo presente, `CompanySettingsService` evalúa primero la versión y produce conflicto 409, en contradicción con el 422 requerido para toda presencia de campo fijo. No hay escritura ni auditoría; falta ajustar el orden y cubrir la combinación.
- PASS independiente: `mvn -q "-Dtest=CompanySettingsServiceTest,CompanyControllerTest" test`; se reutiliza `mvn -q clean verify` de Desarrollo para el mismo Candidate-ID. `git diff --check` PASS.
- Riesgo pendiente: no existe prueba del nuevo controlador HTTP; la ausencia de compañía activa en PATCH no tiene traducción explícita.

## Delta de remediación

- La validación de presencia de campos fijos se ejecuta después de autorizar y antes de leer la versión: por tanto, payload fijo + `If-Match` obsoleto devuelve 422 sin lectura, mutación ni auditoría.
- `CompanySettingsController` traduce configuración activa ausente a 403 neutral, tanto en GET como PATCH, sin 500.
- Añadidas pruebas de precedencia y MockMvc del controlador (422 y configuración ausente). PASS `mvn -q '-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest' test`; `git diff --check` PASS.

## Delta QA de remediación

- `PASS`: la revalidación confirma que los campos fijos se rechazan antes de la lectura/versionado, sin efectos, y que GET/PATCH sin configuración activa responden 403 neutral, sin 500.
- Evidencia independiente: `mvn -q "-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest" test` PASS; `git diff --check` PASS. Se reutiliza `mvn -q clean verify` previo al no cambiar composición.

## Delta QA de remediación Security

- `PASS`: presencia JSON `null` o no nula de los tres campos fijos produce 422 antes de lectura, escritura y auditoría. Body vacío, ETag inválido y JSON ilegible incrementan exactamente una vez el contador seguro `company.settings.rejected` del adaptador, sin tags ni datos sensibles.
- Evidencia independiente: `mvn -q "-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest" test` PASS; `git diff --check` PASS. Se reutiliza `mvn -q clean verify` previo al no cambiar composición.

## Delta QA de remediación de coerción

- `PASS`: `saleEditWindowMinutes` permite únicamente entero JSON 0–10080; decimal, `null`, string, booleano, objeto, arreglo y fuera de rango dan 422 antes del caso de uso, sin efectos, y emiten exactamente una métrica segura sin tags ni datos sensibles.
- Evidencia independiente: `mvn -q "-Dtest=CompanySettingsServiceTest,CompanySettingsControllerTest" test` PASS; `git diff --check` PASS. Se reutiliza `mvn -q clean verify` previo al no cambiar composición.

## Delta DoF

- `PASS`: Candidate-ID `HEAD 66c8cf2 + diff 64302b321019` coincidente en Development, QA y Security; estados habilitantes `READY_FOR_HANDOFF` / `PASS` / `PASS` y evidencia CI aplicable declarada. `git diff --check` PASS en DoF.
