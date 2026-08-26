# BE-027 — Handoff Development

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `37da94f + 8b164f2` (HEAD + digest del diff BE-027 de Development, recalculado tras la remediación).

Implementado `GET /routes/suggested-customers` en [RouteController.java](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/adapter/in/rest/RouteController.java), con caso de uso hexagonal y configuración en `routing`. Los puertos públicos de Clientes/Workforce aportan candidatos con cartera vigente, hecho `last_completed_visit_at` y territorios activos, sin acceso directo entre adaptadores de módulos.

Remediado `SEC-BE027-001` en [ListSuggestedCustomersService.java](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/application/ListSuggestedCustomersService.java): valida `page`/`pageSize` y calcula el offset como `long` antes de autorización o llamadas a Workforce/Clientes; rechaza un offset no indexable como `Invalid`. El controlador conserva su mapeo contractual a 400 neutral y `X-Correlation-Id`, sin datos parciales ni efectos laterales.

Cobertura: rol/tenant/vendedor/equipo antes de consulta; clientes/territorios/frecuencias no vigentes excluidos; fechas Lima inclusivas; razones cerradas, prioridad, orden y paginación; regresión de desbordamiento con cero interacciones a puertos. No hay migraciones, auditoría, eventos ni escrituras.

Pruebas PASS:

- `mvn '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=ListSuggestedCustomersServiceTest' test` (4 PASS).
- `git diff --check`.

Riesgo residual: `America/Lima` está encapsulada como constante hasta que exista zona IANA configurable por empresa. Reproducción SEC-BE027-001: invocar GET con `sellerId` y `date` válidos, `page=107374183&pageSize=20`, bajo `COMPANY_ADMIN` o `SUPERVISOR`; devuelve 400 con `correlationId` sin consultar candidatos. Un vendedor ajeno/inactivo devuelve 403 y no consulta candidatos.
