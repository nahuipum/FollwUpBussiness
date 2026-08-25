# FE-033 — Paquete de contexto

- **Estado actual:** PASS
- **Candidate-ID:** `HEAD+babe434 diff:f0c0b0c6d6f4`.
- **Alcance:** Integrar `Geocerca y tracking` dentro de Configuración; consultar `GET /company/settings` y editar exclusivamente campos permitidos por contrato. Sin GPS, mapas, WebSocket, tracking en vivo ni lógica cliente de geocerca.

## Decisiones y contrato

- OpenAPI `GET /company/settings`: COMPANY_ADMIN, SUPERVISOR y SELLER. Responde `ETag` con la versión vigente entre comillas (p. ej. `"7"`), que se reenvía literalmente en `If-Match`. `PATCH`: solo COMPANY_ADMIN, con `CorrelationId` e `If-Match`; el 200 entrega un `ETag` con la versión resultante; cubrir 200/400/403/409/422.
- `geofenceRadiusMeters=100`, `trackingIntervalSeconds=60` y `locationRetentionDays=90` son constantes MVP. ADR-016 exige ADR sustituto para cambiarlos. Se presentan como política de solo lectura; nunca se envían como configuración modificable.
- Los campos potencialmente editables según esquema son `timezone`, `currency` y `saleEditWindowMinutes`; el desarrollo debe confirmar el soporte real y reutilizar los patrones de formulario existentes.
- Tenant e identidad se derivan de sesión; no aceptar ni persistir tenant desde URL, formulario o estado manipulable. Invalidar estado ante logout/cambio de empresa.

## Riesgos/invariantes

1. Rol: lectura para los tres roles GET; controles PATCH solo COMPANY_ADMIN; servidor sigue siendo autoridad.
2. Conflicto: 409 no sobrescribe; permite recargar y revisar antes de reintentar.
3. Privacidad: sin coordenadas, rutas, tokens, payloads completos o PII en consola/telemetría/mensajes. Política: tracking solo durante jornada activa, se detiene por logout/revocación y ubicación desactualizada no es actual.
4. Estados accesibles: carga, error/red, 403, sesión expirada, 422, conflicto y última actualización.

## Referencias consultadas

- `docs/stories/frontend/FE-033-configurar-geocerca-y-tracking.md`
- `docs/stories/backend/BE-054-configurar-geocerca-y-tracking.md`
- `docs/api/openapi.yaml` (`/company/settings`, `CompanySettings`, `UpdateCompanySettingsRequest`)
- `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md` (D1, D2, D4, D5-D8 y límites de contrato)
- No existe mockup FE-033; usar patrones de Configuración/layout/formularios existentes.

## Contradicción resuelta

**Media, no bloqueante:** textos de FE-033/BE-054 indican ajustar parámetros, pero OpenAPI y ADR-016 hacen inmutables radio, frecuencia y retención. Remediación: mostrar esos tres valores como política fija y limitar PATCH a los campos realmente editables; no modificar Backend ni crear ADR.

## Delta Backend — bloqueo contractual cerrado

El adaptador existente ya emitía `ETag` derivado de `Company.version()` en GET y PATCH. Se documentó esa cabecera en ambos 200 de `docs/api/openapi.yaml`, incluido el formato y que PATCH reemplaza la versión previa. La prueba del adaptador verifica GET con `ETag: "7"`. No hubo cambios de dominio, migraciones ni habilitación de radio, frecuencia o retención.

Verificado: `mvn -q -Dtest=CompanySettingsControllerTest test` y `mvn -q clean verify` finalizaron correctamente; `git diff --check` sin hallazgos.

## Delta Development Frontend

Se integró Configuración en rutas de empresa, supervisor y vendedor. `GET /company/settings` conserva el `ETag` contractual entre comillas y el `PATCH` de COMPANY_ADMIN lo reenvía literalmente en `If-Match`; tras 200 reemplaza el valor. El formulario solo envía `timezone`, `currency` y `saleEditWindowMinutes`; radio, frecuencia y retención son informativos y fijos. La carga se invalida por generación de sesión; hay estados de carga, error, 403, 422, 409, datos obsoletos y última actualización.

## Handoffs requeridos

Development → QA frontend independiente → Seguridad → DoF. Seguridad aplica por roles, tenant y política de ubicación.

## Delta QA frontend

**PASS — Candidate-ID `HEAD+babe434 diff:f0c0b0c6d6f4`:** cierre Security revalidado. Con ETags iguales A/`"7"`→B/`"7"`, la generación 1→2 impide renderizar o enviar A; tras sincronizar solo permite B (`COP`, 45). Hook y API conservan limpieza/GET y ETag contractual. Comando QA: pruebas página+hook+API (7 PASS).

## Delta remediación Development

El listener de sesión ahora invalida snapshot/ETag, conserva el estado de carga y ejecuta un GET nuevo para la generación vigente. La prueba de hook mantiene la respuesta del tenant nuevo pendiente y comprueba que no se reutiliza `"7"` antes de recibir `"8"`. Verificado: 5 pruebas focalizadas y `npm run typecheck` PASS; `git diff --check` sin hallazgos (solo avisos CRLF).

## Delta Seguridad frontend

**CHANGES_REQUIRED — Candidate-ID `HEAD+babe434 diff:f1b955bf314e`:** hallazgo Medio de aislamiento tenant: al llegar snapshot B, el formulario aún puede renderizar/enviar valores A con ETag B antes de sincronizarse por efecto. Cierre: vincular form a ETag/generación, impedir render/submit desalineado y probar transición A→B.

## Delta revalidación Seguridad frontend

**CHANGES_REQUIRED — Candidate-ID `HEAD+babe434 diff:472abbe1f8a4`:** el vínculo por ETag no aísla tenants porque dos empresas pueden compartir versión. El caso `A/"7" → B/"7"` aún permite render/submit transitorio de A. Cierre: vincular a generación/identidad o referencia única y probar ETags iguales.

## Delta final Seguridad frontend

**PASS — Candidate-ID `HEAD+babe434 diff:f0c0b0c6d6f4`:** reproducido A/`"7"`/gen1→B/`"7"`/gen2; la generación bloquea render/submit de A y solo B se guarda. Roles, PATCH limitado, ETag/If-Match, política fija y privacidad sin regresión. Sin hallazgos abiertos.

## Delta remediación Seguridad Development

El formulario ahora conserva el ETag con sus valores y solo se renderiza/envía si coincide con el snapshot vigente; mientras cambia muestra sincronización. La prueba A→B confirma que no aparece ni se envía moneda A (`USD`) tras recibir B (`COP`, ETag `"8"`). Verificado: 4 focalizadas y `npm run typecheck` PASS; `git diff --check` sin hallazgos (solo CRLF).

## Delta remediación Seguridad Development 2

El formulario también conserva la generación de sesión y solo se alinea con snapshot de la misma generación, además del ETag. La prueba A/`"7"`→B/`"7"` con generación 1→2 confirma que no renderiza ni envía `USD` de A y solo guarda `COP`/45 de B. Verificado: 5 focalizadas y `npm run typecheck` PASS; `git diff --check` sin hallazgos (solo CRLF).

## Delta DoF

**PASS — Candidate-ID `HEAD+babe434 diff:f0c0b0c6d6f4`:** Development frontend, QA y Seguridad están en estado permitido y trazados al candidato; sin hallazgos abiertos. CI Backend queda conciliada explícitamente al candidato final porque los deltas posteriores fueron solo frontend/artefactos sin superficie Backend. `git diff --check` sin errores.

## Delta conciliación de evidencia Backend

El CI Backend se ejecutó sobre `HEAD+babe434 diff:f05d82d20f71`. Entre ese digest y el candidato final `HEAD+babe434 diff:f0c0b0c6d6f4` solo cambiaron frontend y artefactos FE-033; no cambió superficie Backend, contrato, dependencias ni configuración. La evidencia Backend se mantiene aplicable y el handoff la declara explícitamente.
