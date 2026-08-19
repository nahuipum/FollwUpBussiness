# FE-008 — QA Frontend

**Estado:** `PASS`  
**Candidate-ID:** `HEAD c4bf994 + FE008 085f8866153c`.

## Mapeo y evidencia

- Acceso/rutas: `canAccessPath`, ruta protegida y navegación exponen Clientes solo a `COMPANY_ADMIN`/`SUPERVISOR`; no existe ruta Seller. `App.test.tsx` cubre ambos paneles y la ausencia de navegación administrativa para Supervisor.
- Consulta: `api.ts` construye exactamente los ocho filtros contractuales, conserva paginación del servidor y valida la respuesta. `api.test.ts` cubre combinación completa y rechazo de respuesta inválida.
- UI: `useClients` reinicia página ante cada filtro, invalida respuestas obsoletas y limpia filas, opciones, filtros, error y metadata al cambiar sesión/tenant o recibir `403`. `CompanyClientsPage` presenta carga, actualización marcada no vigente, vacío, cero resultados, error y prohibido; tabla/filtros poseen nombres accesibles. `ClientTable.test.tsx` confirma tabla semántica, minimización de datos y paginación.
- Privacidad/referencias: no hay mocks ni escrituras; tabla solo muestra nombre, segmento, cantidad y estado; omite UUID, contacto, dirección y coordenadas. Las únicas referencias son `/territories` y `/sellers`, paginadas fuera de las filas (sin N+1).

## Validación

`npm test -- --run src/features/company-clients/api.test.ts src/features/company-clients/components/ClientTable.test.tsx src/app/App.test.tsx` — 31 pruebas correctas.  
`git diff --check` — correcto. Puerta verificada: handoff Desarrollo `READY_FOR_HANDOFF`, Candidate-ID coincidente; árbol con cambios ajenos preservados.

Sin hallazgos bloqueantes. Riesgo residual: la autorización y el alcance de cartera/tenant dependen del backend, que sigue siendo la autoridad al manipular parámetros.
