# FE-039 — Revisión de Seguridad

**Estado:** PASS  
**Candidate-ID:** `b68a8d2 + FE-039-0ae6cdff`

## Superficie revisada

Diff productivo de FE-039: composición y control local de `/platform/companies`, sesión/restauración, transporte autenticado, listado/creación de empresas, selección y aprovisionamiento del administrador inicial. Se revisaron `PLATFORM_SUPERADMIN`, manipulación/cruce de empresa, escalación de rol, fuga de activación/credenciales y limpieza ante reemplazo de sesión.

## Resultado y hallazgos

**PASS — sin hallazgos explotables.** La ruta exige sesión con `PLATFORM_SUPERADMIN` en UI y conserva al Backend como autoridad. `companyId` procede de creación/listado autorizado y se codifica como segmento; el payload de aprovisionamiento solo contiene `displayName`, `email` y `username`, sin `role`, `tenantId`, contraseña, token, secreto ni enlace. El rol `COMPANY_ADMIN` es fijo y no editable. Las respuestas obsoletas se abortan/descartan por generación de sesión; logout o cambio de identidad limpia formularios, selección, resultados y errores.

**Abuso reproducido — PASS:** se manipuló `companyId` con traversal/query y una escalación de rol, simulando `403`. Resultado: ruta codificada, rechazo conservado, ningún campo de rol/tenant añadido, ninguna transición de éxito y el detalle sensible del servidor no apareció en el error normalizado. Comando focalizado: una prueba Vitest temporal, `1/1 PASS`, eliminada tras ejecutar.

## Controles no aplicables y riesgo residual

WebSocket, Redis/cache, mensajería, archivos, pagos, dependencias e infraestructura: no afectados. `NOT_EXECUTED`: autorización real del Backend, ya fuera del alcance frontend; riesgo residual: un cliente puede invocar el endpoint directamente, por lo que el servidor debe mantener autorización `PLATFORM_SUPERADMIN` y validación de empresa en cada operación.
