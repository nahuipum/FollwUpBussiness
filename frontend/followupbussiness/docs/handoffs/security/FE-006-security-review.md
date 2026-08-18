# FE-006 — Revisión final de Seguridad

**Veredicto: PASS**  
**Candidate-ID:** `HEAD 35836fd + FE-006 formulario/api/sesión/pruebas; delta: recarga accesible 409`

## Superficie revisada

Autorización de creación/edición, aislamiento por empresa, manipulación de `sellerId`/`supervisorId`/`territoryIds`, PII del vendedor, invitación, CSRF y limpieza ante logout/cambio de sesión. Se revisaron paquete, handoff QA, diff y código/pruebas afectados; no fue necesario abrir fuentes primarias.

## Resultado y evidencia

- **PASS — Roles y autoridad.** `CompanySellersPage` y `SellerTable` solo exponen crear/editar cuando la identidad incluye `COMPANY_ADMIN`; `SUPERVISOR` queda en solo lectura. Los clientes no confían en esos controles: toda mutación usa Bearer + CSRF y envía los IDs al API para autorización y validación tenant del servidor.
- **PASS — Sesión y datos.** `useSellerForm` invalida solicitudes/mutaciones y elimina diálogo, opciones, error y estado ocupado al cambiar sesión; `apiRequest` aborta peticiones de generaciones anteriores. No se añadieron logs ni almacenamiento persistente de payloads, PII, IDs, tokens, credenciales o enlaces; el formulario no solicita ni muestra secretos de invitación.
- **PASS — Abuso reproducido.** `npm test -- --run src/features/company-sellers/api.test.ts src/features/company-sellers/hooks/useSellerForm.test.tsx -t "envía creación y edición|cambio de sesión"`: 2 pruebas PASS. Confirma que IDs arbitrarios pueden llegar al servidor sin convertirse en autorización cliente y que el cambio de sesión revoca el estado local.

## Controles no aplicables y riesgo residual

WebSocket, Redis/cache, mensajería, archivos, dependencias e infraestructura no cambiaron. No se ejecutó un Backend integrado para observar el `403` de un `SUPERVISOR` o IDs de otro tenant; riesgo residual aceptado porque Backend/contrato no cambian y siguen siendo la autoridad.
