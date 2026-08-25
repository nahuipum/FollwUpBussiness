# FE-033 — Development Backend: corrección contractual

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID final conciliado:** `HEAD+babe434 diff:f0c0b0c6d6f4`

## Alcance y contratos

Se cerró el bloqueo de concurrencia de `/company/settings`. El adaptador ya emitía `ETag` desde `Company.version()` en GET y PATCH; se alineó OpenAPI para declarar en ambos `200` un `ETag` entre comillas (p. ej. `"7"`). El valor de GET se reenvía sin transformación en `If-Match`; el `ETag` de PATCH sustituye el anterior para la siguiente edición.

No se modificaron reglas de geocerca, tracking o retención: los campos fijos de ADR-016 siguen rechazados por el caso de uso. No hay migraciones.

## Archivos

- `docs/api/openapi.yaml`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/adapter/in/rest/CompanySettingsControllerTest.java`
- `docs/handoffs/governance/FE-033-context-package.md`

## Verificación y criterio cubierto

- `mvn -q -Dtest=CompanySettingsControllerTest test` — PASS.
- `mvn -q clean verify` — PASS.
- `git diff --check` — PASS.

La prueba nueva confirma que GET devuelve `ETag: "7"`; OpenAPI documenta también la versión posterior de PATCH. FE puede leer el encabezado, enviarlo en PATCH y reemplazarlo tras `200`; `409` permanece como conflicto sin sobrescritura.

**Riesgo residual:** ningún cambio funcional Backend; el cliente debe preservar las comillas del encabezado.

## Conciliación de candidato

La ejecución Backend ocurrió sobre `HEAD+babe434 diff:f05d82d20f71`. Los deltas posteriores hasta el candidato final `HEAD+babe434 diff:f0c0b0c6d6f4` fueron exclusivamente en `frontend/followupbussiness` y sus artefactos FE-033; no cambiaron código, pruebas, dependencias, configuración ni contrato Backend. Por ello la evidencia `mvn -q clean verify` permanece aplicable al candidato final sin repetir la suite.
