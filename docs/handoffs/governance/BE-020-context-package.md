# BE-020 — Paquete de contexto

## Estado

`PASS` (DoF final).

Candidate-ID: c400a82 + cfdea15abc0a (working tree).

## Alcance e invariantes

- Endpoint: `GET /customer-imports/{importId}/errors`; actor autenticado `COMPANY_ADMIN`, tenant e identidad sólo desde sesión.
- Éxito: CSV UTF-8 seguro de errores de una importación propia; denegación sin archivo ni metadatos; vencido `410` sin contenido; dependencia degradada sin descarga parcial; observabilidad con `correlationId` y sin PII/contenido.

## Evidencia y bloqueo

- `docs/api/openapi.yaml` (`/customer-imports/{importId}/errors`) declara sólo `200`, `400`, `403`, `404` y `410`; `404` describe importación inexistente/no accesible.
- BE-019 persiste `customer_import_row_error(import_id,row_number,error_code)` y la política de 30 días (`JdbcCustomerImportStore.complete/fail`, `purgeExpiredRowErrors`). No conserva valores de fila; por minimización de PII el CSV puede limitarse a número y motivo/código.
- Falta semántica contractual para un trabajo propio, terminal y no vencido con `rejected_rows = 0` / sin filas de error. No es inexistente/no accesible y no corresponde inferir un código HTTP o un CSV vacío.

## Decisión adoptada

Para un trabajo propio, terminal, no vencido y sin filas rechazadas, responder `404 Not Found` neutral con el mecanismo de error contractual ya vigente. El recurso solicitado es el archivo de errores, que no existe; no se entrega un CSV vacío ni se introduce un código HTTP nuevo. Esta respuesta se mantiene indistinguible de importación inexistente/no accesible para actores no autorizados.

## Desarrollo

- Se añadió el puerto DownloadCustomerImportErrorsUseCase, consulta de errores limitada por tenant_id y endpoint CSV UTF-8. Sólo emite row_number,error_code; normaliza códigos no controlados a INVALID_ROW.
- COMPANY_ADMIN se valida desde sesión. Inaccesible, no terminal, sin rechazos o sin filas dan 404; vencido da 410; no hay cuerpo CSV en rechazos. La descarga registra RESOURCE_ACCESS con contexto confiable/correlationId y la métrica customer_imports.errors.downloaded; si falla auditoría, no se entrega archivo.
- No hay migración: reutiliza customer_import_row_error de V38.
- Validación: pruebas focalizadas PASS y mvn -q clean verify PASS; git diff --check PASS.
- QA independiente: descarga/CSV seguro, tenant/rol, 404 neutral, vencimiento 410, auditoría/métrica/correlationId y fallo de auditoría sin archivo parcial validados. Pruebas focalizadas QA PASS; sin hallazgos.
- Seguridad final PASS: abuso de `importId` válido de otro tenant retorna 404 sin lectura de filas ni CSV. Reutilizó QA y `clean verify` del mismo candidato; no encontró exposición de PII, fórmulas, secretos ni contenido en observabilidad.
- DoF PASS: Dev `READY_FOR_HANDOFF`, QA PASS y Seguridad PASS trazables al mismo Candidate-ID; evidencia CI declarada y `git diff --check` final sin errores.
