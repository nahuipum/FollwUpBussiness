# QA Frontend — FE-043

Estado: `PASS`  
Candidate-ID: `71a31cc + 68a518fe` (HEAD `71a31cc62f9e9d84442e56df66575334c9913569`; superficie FE-043 sin commit, coherente con el digest del paquete).

| Criterio | Implementación | Evidencia |
|---|---|---|
| Estados y permiso | `CompanyUsersTable`, guardia de ruta y solo lectura para SUPERVISOR | Pruebas focalizadas; revisión directa. |
| Modal/reenvío | Diálogo precargado, título/CTA, POST exclusivo con `If-Match` entrecomillado | `api.test.ts`; prueba de ruta. |
| Éxito/errores | Sólo `202` reemplaza la fila y comunica aceptación; 401/403/404/409/422/503 sin éxito | Prueba de conflicto y revisión directa. |
| Sesión/UX | Cancelación/doble envío bloqueados, obsolescencia y cambio de sesión invalidan mutación y limpian estado; diálogos accesibles | Pruebas focalizadas y revisión directa. |

Comandos: `npm test -- --run src/features/company-users/api.test.ts src/features/company-users/CompanyUsersPageRoute.test.tsx` (PASS, 10); `npm run typecheck` (PASS). `git diff --check` no informó errores en las rutas FE-043 afectadas.

Regresión directa: como `COMPANY_ADMIN`, abrir una fila `INVITED`, corregir y enviar; verificar POST/versión y actualización de esa sola fila tras `202`. `ACTIVE` conserva Editar; `LOCKED`/`INACTIVE` reactivan. No se exponen token/enlace ni roles de plataforma. Riesgo residual: autorización y aislamiento tenant se imponen en servidor; la UI no los suplanta.
