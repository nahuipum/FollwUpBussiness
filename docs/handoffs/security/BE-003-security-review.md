# BE-003 — revisión de seguridad

**Estado:** PASS
**Candidate-ID:** `HEAD 71a31cc + backend-diff f8ae5b88eca5d085f7209b640bd07ab61ba52cb8`

## Superficie revisada

Autenticación y sesión en `/me`, login y refresh; aislamiento por `tenantId`; estado de cuenta/empresa; respuesta contractual y ausencia de secretos. La reapertura se limitó a la nueva evidencia HTTP y a reconciliar el Candidate-ID QA. No se releyeron fuentes primarias.

## Resultado

- **PASS — aislamiento (Alta):** `CurrentUserProjection.from(actor)` recarga la cuenta por `accountId`, exige coincidencia exacta de rol y empresa con el actor autenticado y consulta únicamente el `companyId` persistido. `/me` no obtiene tenant desde parámetro, body o header.
- **PASS — abuso reproducido (Alta):** `actorWithDiscordantTenantIsRejectedBeforeAnyCompanyIsReadOverHttp` presenta un actor `SELLER` con `tenantId` de otra empresa; `GET /me` devuelve `401 AUTHENTICATION_FAILED` y `verifyNoInteractions(companies)` confirma cero consulta o exposición ajena. Reproducción independiente: `mvn -q '-Dtest=CurrentUserControllerTest#actorWithDiscordantTenantIsRejectedBeforeAnyCompanyIsReadOverHttp' test`, código 0.
- **PASS — exposición:** plataforma conserva `company=null`; la proyección no incluye hash, tokens, CSRF, sesión, auditoría ni datos fuera del contrato.

No se identificaron hallazgos explotables. Archivos, WebSocket, Redis/mensajería, dependencias e infraestructura no aplican al delta.

## Riesgo residual

Bajo: una rotación concurrente puede ocurrir antes del rechazo, pero no se emiten credenciales ni cookie y PostgreSQL valida el uso posterior.
