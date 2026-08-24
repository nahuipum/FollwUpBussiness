# FE-012 — Handoff de Desarrollo Frontend

- **Estado:** READY_FOR_HANDOFF
- **Candidate-ID:** `3c13280+dafdabcf8d32`
- **Alcance:** ruta `/company/customer-imports`, submenú de Clientes y feature `company-client-import` (UI, hook, API, tipos y pruebas).

Implementado: acceso UI exclusivo `COMPANY_ADMIN`; descarga de plantilla y conservación de `X-Template-Version`; multipart con CSRF e `Idempotency-Key`; validación sin parsear ni exponer contenido/nombre del archivo (CSV/XLSX, 10 MiB); selección explícita de aceptación parcial; un POST por intento; polling hasta estado terminal; limpieza por cambio de sesión/empresa y estados accesibles de carga, error, prohibido y resultado.

Remediación QA P1: `Carga de clientes` ahora se añade al submenú sólo cuando `canManage` es verdadero. La regresión prueba que un `SUPERVISOR` no ve la opción en layout de empresa y que `COMPANY_ADMIN` sí la ve.

| Criterio | Evidencia |
|---|---|
| Plantilla/versionado/transporte | `api.test.ts` (3 pruebas) |
| Tipo/tamaño, no duplicación, polling, limpieza | `useCustomerImport.test.tsx` (3 pruebas) |
| Ruta, rol y submenú | `App.tsx`, `auth.ts`, `CompanyWorkspaceLayout.tsx`, `CompanyWorkspaceLayout.test.tsx` |

Comandos correctos: `npm test -- --run src/app/components/CompanyWorkspaceLayout.test.tsx src/features/company-client-import/api.test.ts src/features/company-client-import/hooks/useCustomerImport.test.tsx` (7/7), `npm run typecheck`, `npm run build`, `git diff --check`. El build mantiene aviso existente de bundle >500 kB.

Riesgo/reproducción: inicie sesión como `COMPANY_ADMIN`, abra Clientes → Carga de clientes, descargue plantilla, seleccione CSV/XLSX <=10 MiB y envíe; observe polling. Un 403/401 limpia el flujo; 409/413/415/422 no reenvían. Se abrió sólo el fragmento OpenAPI de imports/`CustomerImportJob` por ambigüedad de tipado. Referencia visual: layout y `company-clients`; no había mockup FE-012.
