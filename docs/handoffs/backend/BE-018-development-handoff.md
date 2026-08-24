# BE-018 — Handoff de Development

## READY_FOR_HANDOFF

- **Candidate-ID:** `e7224d6+e7e7713272fc`.
- **Alcance/archivos:** endpoint seguro en [`CustomerImportTemplateController.java`](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/adapter/in/rest/CustomerImportTemplateController.java), puerto/servicio/configuración de `imports` y prueba REST dedicada. Solo deriva actor de sesión; no recibe `tenantId` ni persiste/produce eventos.
- **Contrato:** [`openapi.yaml`](../../api/openapi.yaml) documenta negociación (`CSV` por defecto y `*/*`, XLSX explícito, 406 incompatible), columnas/obligatoriedad y parseo BE-019 de metadatos. Sin migraciones.
- **Evidencia:** CSV UTF-8 con `# template-version: 1.0`, encabezado exacto y ejemplo sin PII ni fórmulas; XLSX con `TemplateVersion=1.0`, encabezado y celdas no formula. Incluye `X-Correlation-Id`, versión y archivo adjunto.
- **Remediación QA:** negociación `Accept` respeta exclusiones `q=0` y selecciona CSV/XLSX por mayor calidad; ambos excluidos/no compatibles devuelven 406. Pruebas añadidas para exclusión y preferencia XLSX.
- **Pruebas:** `mvn -q -Dtest=CustomerImportTemplateControllerTest test` PASS. `mvn -q clean verify` PASS reutilizado del candidate anterior; no repetido por corrección aislada de lógica/prueba. `git diff --check` sin errores (advertencias CRLF ajenas).
- **Criterios/invariantes:** éxito exclusivo `COMPANY_ADMIN`; anónimo, `SUPERVISOR` y `SELLER` reciben 403 sin archivo; `Accept: application/json` recibe 406 sin archivo. Generación estática y atómica, sin datos tenant/PII ni escrituras/auditoría de contenido.
- **Riesgo/reproducción:** la política de fórmulas se aplica al ejemplo generado; BE-019 debe rechazar/neutralizar fórmulas en carga conforme a su implementación. Reproducir con `GET /customers/import-template`, autenticado como admin, y `Accept` CSV/XLSX/JSON.
