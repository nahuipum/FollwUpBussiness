## FE-039 — Desarrollo (corrección QA)

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `b68a8d2 + FE-039-0ae6cdff`

### Corrección aplicada

- `/platform/companies` es la única ruta que compone `PlatformCompaniesPage`.
- `/platform/dashboard` recupera el `SessionStatusPage` pendiente de su panel, sin renderizar “Empresas”.
- Se incluyó `/platform/dashboard` en la matriz local de acceso para `PLATFORM_SUPERADMIN`, coherente con su ruta protegida; la autorización del servidor permanece obligatoria.
- Añadida regresión directa que inicia sesión como superadministrador, abre el dashboard y verifica que no se renderice el encabezado de empresas.

### Archivos

`src/app/App.tsx`, `src/app/App.test.tsx`, `src/features/auth/auth.ts`.

### Verificación

- `npm run typecheck` — PASS.
- `npm run test -- src/app/App.test.tsx src/features/auth/auth.test.ts src/features/platform-companies/PlatformCompaniesPage.test.tsx` — PASS (34).
- `git diff --check` — PASS.

### Criterio y reproducción

Con sesión `PLATFORM_SUPERADMIN`, navegar directamente a `/platform/dashboard`: se muestra “Sesión iniciada / Redirigiendo a tu panel”, no “Empresas”. `/platform/companies` continúa siendo la pantalla de FE-039. Riesgo restante: conservar la validación funcional de FE-039 ya cubierta en el candidato previo durante QA de corrección.
