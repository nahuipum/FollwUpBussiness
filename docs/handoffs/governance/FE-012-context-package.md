# FE-012 — Paquete de contexto

- **Estado:** Desarrollo listo para handoff.
- **Candidate-ID:** `3c13280+dafdabcf8d32`.
- **Alcance:** Nueva ruta y opción `Clientes → Carga de clientes`, exclusiva de `COMPANY_ADMIN`, para descargar plantilla, validar y enviar CSV/XLSX, y consultar el trabajo inicial.

## Contrato estable y decisiones

- `GET /customers/import-template`: `COMPANY_ADMIN`; `Accept` CSV/XLSX, conserva `X-Template-Version`; manejar 400/403/406.
- `POST /customer-imports`: multipart `templateVersion`, `partialAcceptance`, `file`; `Idempotency-Key`, `CorrelationId` si se integra al mecanismo estándar; 202 con `Location` y `CustomerImportJob`; manejar 400/403/409/413/415/422.
- `GET /customer-imports/{importId}`: sólo tenant actual y `COMPANY_ADMIN`; estados de `CustomerImportJob` para polling controlado.
- Formatos CSV UTF-8 o XLSX sin macros; máximo 10 MiB. No parsear ni mostrar el contenido local. `partialAcceptance` está definido y por defecto es `true`; presentarlo como decisión explícita y accesible.
- BE-018 tiene DoF PASS. BE-019 tiene QA y Security PASS sobre `7de8183 + 2e06ffdb2ab6`; no existe bloqueo Backend.

## Invariantes

1. Actor/recurso: sólo `COMPANY_ADMIN` ve y accede a la ruta; servidor sigue siendo autoridad.
2. Éxito: versión recibida de plantilla se envía; un solo POST por intento lógico y trabajo consultado sin duplicación.
3. Denegación: 403/401 limpian flujo y dan estado accesible; no se exponen datos del archivo.
4. Conflicto/rechazos: 409, 413, 415, 422 y 400 no producen reenvío automático ni parsing local.
5. Sesión/tenant: desmontaje, logout o cambio de empresa cancela polling y elimina archivo, versión, trabajo e idempotencia locales.

## Superficie y referencia visual

- No existe `docs/frontendMockups/FE-012*.html`; usar como referencia `company-clients` y el layout real, sin copiar HTML.
- Archivos previsibles: `src/app/App.tsx`, `src/app/components/CompanyWorkspaceLayout.tsx`, `src/features/company-clients/**` o feature de importación, `src/lib/api.ts`, auth y pruebas cercanas.
- FE-013/BE-020 están fuera de alcance salvo enlace/navegación ya disponible; no descargar ni representar errores detallados.

## Gate Development

Estado esperado: `READY_FOR_HANDOFF` o `BLOCKED`. Verificar pruebas focalizadas, type-check y `build`/CI equivalente por cambio de rutas, autorización y transporte compartidos. Artefacto siguiente: `docs/handoffs/frontend/FE-012-development-handoff.md`.

## Delta Development

- Ruta y submenú `Clientes → Carga de clientes` restringidos en UI a `COMPANY_ADMIN`; el servidor permanece como autoridad.
- Transporte seguro: descarga de plantilla/versionado, multipart con CSRF e `Idempotency-Key`, validación local de tipo/tamaño sin leer contenido y polling cancelable en desmontaje/cambio de sesión o empresa.
- Se consultó `docs/api/openapi.yaml` (rutas y `CustomerImportJob`) por ambigüedad de la forma necesaria para tipar el polling.
- Remediación QA P1: el submenú `Carga de clientes` recibe `canManage` y no se representa para `SUPERVISOR`; prueba de regresión de navegación/rol añadida.
