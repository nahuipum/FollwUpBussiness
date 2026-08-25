# FE-033 — Revisión de Seguridad

**Estado:** PASS  
**Candidate-ID:** `HEAD+babe434 diff:f0c0b0c6d6f4`

## Superficie revisada

Rutas y permisos de COMPANY_ADMIN, SUPERVISOR y SELLER; GET/PATCH `/company/settings`; tenant derivado de sesión; limpieza al cambiar empresa/logout; `ETag`/`If-Match` y 409; mensajes, política fija y exposición de datos sensibles.

## Resultado y evidencia

- **PASS — abuso A→B:** el formulario conserva ETag y generación; render y submit exigen coincidencia con snapshot y sesión vigentes. El cambio `1→2` bloquea A aunque B comparta `ETag "7"`; tras sincronizar solo presenta/envía `COP` y 45 de B.
- Reproducción: `npm test -- src/features/company-settings/CompanySettingsPage.test.tsx -t "con ETag igual en B no muestra ni envía los valores A"` aprobó; no se renderizó ni envió `USD` de A.

- **PASS — roles:** los tres roles consultan; solo COMPANY_ADMIN recibe guardado. PATCH usa autorización de mutación y solo envía `timezone`, `currency` y `saleEditWindowMinutes`.
- **PASS — abuso de rol:** `npm test -- src/features/company-settings/CompanySettingsPage.test.tsx -t "presenta la misma configuración como solo lectura al supervisor"` aprobó; el SUPERVISOR no obtiene botón ni campos editables.
- **PASS — tenant/sesión:** no hay `tenantId`/`companyId` manipulable; la generación invalida snapshot, ETag, formulario, error, conflicto y última actualización, y descarta respuestas previas.
- **PASS — concurrencia:** ETag se conserva y reenvía literalmente; se reemplaza tras 200 y 409 exige recarga sin sobrescritura.
- **PASS — privacidad:** no hay logs de secretos, PII, payloads ni coordenadas; los mensajes son genéricos. Los tres parámetros de política son solo lectura y no forman PATCH.

## Riesgo residual

Sin hallazgos abiertos. No aplican GPS, coordenadas, almacenamiento local nuevo, WebSocket, Redis/cache compartida, mensajería, archivos, dependencias ni infraestructura. No se repitieron suites Backend; se reutilizó evidencia contractual del mismo candidato. La autorización efectiva de PATCH sigue siendo responsabilidad del servidor.
