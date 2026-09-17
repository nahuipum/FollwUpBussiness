# FE-033 — Informe final de Seguridad

**Estado:** PASS  
**Candidate-ID:** `HEAD:574be0e+diff:d56c4e1c`

**Superficie revisada:** diff de `company-settings` y componentes compartidos afectados; GET/PATCH `/company/settings`, roles, ETag/If-Match, cambio de sesión/empresa, 403/409 y política de ubicación.

**Controles:** PASS — `COMPANY_ADMIN` puede guardar; `SUPERVISOR` solo consulta. Un 403 de PATCH bloquea los controles y otro envío; 409 y refresco fallido bloquean guardar hasta recarga. PASS — A→B invalida snapshot y respuesta previa; la página exige generación vigente incluso con el mismo ETag. PASS — PATCH usa If-Match del snapshot y la pantalla no presenta coordenadas, personas ni ubicación actual. Evidencia: `CompanySettingsPage.tsx`, `useCompanySettings.ts`, `api.ts` y sus pruebas; QA PASS del candidato funcional.

**Hallazgos:** ninguno nuevo. **Riesgo residual:** `SELLER` sigue bloqueado en React aunque OpenAPI y Backend permiten GET; discrepancia heredada fuera del ajuste visual. La autorización definitiva del servidor no se reejecutó en esta revisión frontend (`NOT_EXECUTED`).

**Conciliación de candidato:** la revisión independiente de Seguridad fue PASS para `HEAD:574be0e+diff:b869a2ef`. El delta posterior hasta este candidato es exclusivamente presentación (espaciado, iconos y alineación de controles) y no cambia datos, roles, contrato ni controles de amenaza; no requiere reapertura de Seguridad. Reproducción adicional de abuso: `NOT_EXECUTED`, porque QA y Dev ya cubrieron A→B con ETag igual y reintento 403.

**No aplicable:** secretos, archivos, WebSocket, cache, mensajería, pagos, dependencias e infraestructura, sin cambios en esta superficie.
