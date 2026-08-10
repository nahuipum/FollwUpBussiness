# FE-003 — Informe de Seguridad

**Candidate-ID:** `8822b32 + 2a0a3c8d1c4c`  
**Estado:** PASS

## Superficie y evidencia

Sesión en memoria, refresh cookie/CSRF, logout, cambio de identidad/roles/empresa, cache local y tenant. Reutilizada QA `PASS`.

## Abuso decisivo

Reproducido: `SELLER/tenant-a`, refresh pendiente, logout, login `COMPANY_ADMIN/tenant-b`, respuesta tardía. La prueba dirigida pasa: refresh devuelve `superseded`; solo queda habilitado `/company/dashboard`, `/seller/dashboard` se rechaza e identidad queda en `admin-b/tenant-b`.

## Evidencia y riesgo

`auth.ts` captura generación e instancia de sesión y valida ambas antes de aplicar respuesta; `clearSession()` incrementa generación e invalida vuelo anterior. La regresión comprueba roles, identidad y empresa finales. Access/CSRF solo memoria; refresh usa cookie/CSRF; `401`/`403`/`409` limpian; marcador logout no contiene secretos. Fetch obsoleto no se aborta físicamente, pero no puede restaurar credenciales, identidad, roles o tenant. Servidor mantiene autoridad. No aplican WebSocket, Redis, mensajería, archivos o infraestructura.
