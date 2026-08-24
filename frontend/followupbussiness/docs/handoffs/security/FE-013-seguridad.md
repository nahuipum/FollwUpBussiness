# FE-013 — Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD e327817 + diff rastreado f6761ba6a5cf6ac1192fe760ead8a9b52ec5fe59 + migración V39 y fuentes/pruebas FE-013 no rastreadas; excluye CSV ajenos clientes-importacion-{invalido,valido-1,valido-2}.csv`.

## Superficie revisada

Autorización `COMPANY_ADMIN`, aislamiento por sesión/empresa, UUID no confiable, consultas y descarga autenticadas, limpieza de estado y tratamiento del CSV.

## Controles y evidencia

- **PASS — Autorización:** `auth.ts` restringe la ruta dinámica a `COMPANY_ADMIN`; `App.tsx` solo monta la vista con sesión y UUID válido. La autorización frontend no sustituye al Backend.
- **PASS — Tenant/sesión:** `useCustomerImportResult.ts` incorpora generación, usuario, empresa y roles en la clave de sesión; ante cambio aborta solicitudes y elimina trabajo, contadores y descarga.
- **PASS — Entrada no confiable:** el identificador debe ser UUID y se codifica antes de incorporarse a los endpoints.
- **PASS — Privacidad/archivo:** el CSV se mantiene como `Blob`, no se interpreta, renderiza ni registra; usa nombre local fijo y revoca la URL temporal. `403/404` eliminan los datos previos y `410` bloquea nuevos intentos.
- **PASS — Reproducción de abuso:** cambio de empresa seguido de respuesta tardía y pérdida de autorización `403` → 2 pruebas pasaron; no permanecieron contadores del tenant anterior.

## Hallazgos

Sin hallazgos explotables en el diff frontend revisado.

## No aplicable y riesgos residuales

No cambiaron secretos, almacenamiento local, WebSocket, cache/Redis, mensajería, dependencias ni infraestructura.

**NOT_EXECUTED:** autorización/aislamiento reales del endpoint y neutralización de fórmulas CSV pertenecen al Backend. Riesgo residual: un servidor que no filtre celdas iniciadas con fórmulas podría producir un CSV peligroso al abrirse en una hoja de cálculo; el cierre observable exige sanitización y prueba Backend del archivo generado.

## Delta Backend

**PASS.** `totalRows`/`completedAt` no añaden PII ni relajan los filtros por tenant. Abuso inspeccionado: un mensaje Rabbit con `importId`/tenant cruzados no obtiene `findById` ni `claim`; no crea contexto ni procesa. Para un trabajo válido, el actor, tenant y correlación se obtienen exclusivamente del `CustomerImport` persistido y el `SecurityContext` se limpia en `finally`, evitando herencia entre mensajes. Prueba focalizada: `mvn -q "-Dtest=CustomerImportRequestedListenerTest#rebuildsAndClearsAuditContextFromThePersistedJob,SecurityContextAuditTrustedContextProviderTest#usesThePersistedJobCorrelationAttachedToTheAsyncAuthentication" test` → OK.
