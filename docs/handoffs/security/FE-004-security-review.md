# FE-004 — Revisión de Seguridad

**Estado:** PASS  
**Candidate-ID:** `HEAD+71a31cc / FE-004-95444c0a9a91`

## Superficie revisada

Paquete FE-004, handoff QA, estado/diff, ruta, feature y controles compartidos de sesión/transporte. No se releyeron fuentes primarias: no hubo ambigüedad, contradicción ni riesgo nuevo.

## Resultado y controles

- **PASS — Autorización/escalación:** `/company/users` admite únicamente `COMPANY_ADMIN` o `SUPERVISOR`; las mutaciones solo se muestran a `COMPANY_ADMIN`. Tipos, selector, serialización y parser aceptan exclusivamente `COMPANY_ADMIN|SUPERVISOR`, sin vía a `PLATFORM_SUPERADMIN`, `SELLER` ni roles arbitrarios. Las escrituras usan autorización y CSRF.
- **PASS — Aislamiento tenant:** rutas y payloads no aceptan `tenantId/companyId`; `userId` se codifica. Un cambio de identidad/empresa invalida consultas y mutaciones, desmonta PII, formulario y modales; la generación de sesión aborta respuestas anteriores.
- **PASS — Secretos/PII:** no se almacenan ni registran tokens, credenciales, invitaciones o enlaces. El token permanece en memoria; FE-004 no añade almacenamiento local.
- **PASS — Repetición/obsolescencia:** `submitting` evita doble acción; identificadores de mutación y estado/respuesta válida evitan éxito o actualización por respuestas obsoletas, conflictos o rechazos.

## Abuso reproducido

Cambio de empresa A→B después de mostrar y operar sobre PII de A: prueba focalizada `limpia datos tras cambio de sesión`, **PASS (1/1)**; los datos de A dejan de ser observables.

## Riesgo residual

WebSocket, caché externa, mensajería, archivos, dependencias e infraestructura no cambiaron. Riesgo bajo: Backend conserva la autoridad final de rol y tenant; faltan pruebas focalizadas de 403/409/422 y logout durante mutación.
