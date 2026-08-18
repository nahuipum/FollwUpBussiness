# FE-005 — QA Frontend

Estado: `PASS`  
Candidate-ID: `f712293 + 3E5D437F6C9B`

## Revalidación focalizada posterior a Seguridad

- Cierre tenant/sesión → `sellerSessionKey` y sus suscripciones en `useSellers`/`CompanySellersPage` → `App.test.tsx` → la clave incluye generación, usuario, empresa (por `company.id` cuando existe) y roles. Ante el cambio A→B se invalidan solicitudes, resultados, filtros y actualización; además, se cierra el diálogo antes de cargar B. Por tanto dejan de renderizarse nombre, correo, teléfono y código de A, tanto durante la carga como con los datos de B.
- Regresión supervisor → `/supervisor/sellers` → misma prueba de ruta → conserva el listado real y la navegación exclusiva de supervisor; no se amplían permisos ni acciones y Backend continúa siendo autoridad de tenant/equipo.

Comando: `npm test -- src/app/App.test.tsx` pasa (27/27), incluyendo la regresión A→B y supervisor. No hay hallazgos en el cierre. Riesgo residual: los datos sensibles son estado React efímero; la revocación depende del evento de sesión existente, cubierto por la prueba de reemplazo de sesión.
