# BE-020 — Desarrollo Backend

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** c400a82 + cfdea15abc0a (working tree).

Alcance: se implementó GET /customer-imports/{importId}/errors mediante puerto de aplicación, persistencia tenant-scoped y controlador REST. El CSV UTF-8 contiene exclusivamente row_number,error_code; los códigos fuera del vocabulario permitido se sustituyen por INVALID_ROW, sin valores CSV originales, PII, secretos ni tokens.

Seguridad/contrato: sólo COMPANY_ADMIN desde sesión. Importación no accesible, no terminal, sin rechazados o sin errores devuelve 404 neutral y sin archivo; vencida devuelve 410; rol inválido devuelve 403. Respuesta y auditoría conservan correlationId. La auditoría RESOURCE_ACCESS y métrica customer_imports.errors.downloaded no incluyen contenidos; si la auditoría falla, no se entrega CSV.

Archivos: imports/application/port/in/DownloadCustomerImportErrorsUseCase.java, CustomerImportService.java, CustomerImportStore.java, JdbcCustomerImportStore.java, CustomerImportController.java, ImportsConfiguration.java; pruebas en CustomerImportErrorsServiceTest.java, CustomerImportControllerTest.java y adaptadores afectados.

Contratos/migraciones: sin migración; reutiliza V38__create_customer_imports.sql. No se modificó OpenAPI.

Validación: pruebas focalizadas CustomerImportErrorsServiceTest, CustomerImportServiceTest y CustomerImportControllerTest PASS; mvn -q clean verify PASS (Flyway/PostgreSQL/Testcontainers); git diff --check PASS.

Cobertura: CSV seguro y ordenado; tenant ajeno/no existente, no terminal, expiración; auditoría/métrica; fallo de auditoría sin respuesta parcial; mapeos HTTP 404/410. Riesgo residual: ninguno identificado. Reproducción: admin del mismo tenant solicita una importación terminal con rechazos dentro de 30 días y recibe CSV; cambiar tenant, usar importación pendiente o sin rechazados devuelve 404; después de expiración devuelve 410.
