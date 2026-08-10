# FE-034 — Revisión de Ciberseguridad

Estado: `PASS`  
Candidate-ID: `f027a0b + 337464cb`

## Superficie revisada

Carrera entre cambio de identidad/tenant y respuesta `401`, revocación de sesión activa, aislamiento de permisos y exposición efímera de `correlationId`. Evidencia limitada al paquete, handoffs Dev/QA, diff productivo y prueba de abuso del candidato.

## Resultado

- `PASS` — Severidad: ninguna. `apiRequest` liga cada solicitud a la generación de sesión y descarta como `ApiRequestObsoleteError` la respuesta de una generación reemplazada antes de normalizarla o publicarla. El listener vuelve a validar la generación antes de limpiar sesión o mostrar el error.
- Abuso reproducido: A inicia una solicitud; B reemplaza a A; llega `401` de A con `corr-a`. La prueba confirma que B conserva `admin-b`, `tenant-b` y sus permisos, sin diálogo, redirección, mezcla de tenant ni exposición de `corr-a`. Un `401` vigente posterior con `corr-b` sí revoca B y activa el diálogo con `corr-b`.
- Evidencia ejecutada: `npm test -- --run src/app/App.test.tsx -t "discards a delayed 401 from tenant A after tenant B replaces its session"` — 1/1 correcta.

## Controles no aplicables y riesgo residual

Sin cambios en secretos, archivos, WebSocket, Redis/caché persistente, mensajería, dependencias o infraestructura. No se repitieron suites QA (`NOT_EXECUTED`, evidencia del mismo candidato reutilizada). Riesgo residual bajo: consumidores de `apiRequest` deben tratar `ApiRequestObsoleteError` como descarte sin UI ni reintento.
