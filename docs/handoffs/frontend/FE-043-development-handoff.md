# Handoff Desarrollo — FE-043

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `71a31cc + 68a518fe`.

Implementado en `src/features/company-users/`: `api.ts` usa exclusivamente `POST /company/users/{userId}/invitation` con `If-Match: "<version>"`; menú de `INVITED` ofrece **Corregir y reenviar invitación**, conservando bloqueo con confirmación. `CompanyUserInviteDialog` se reutiliza precargado con título/CTA específicos.

Al recibir sólo `202` se sustituye la fila afectada sin recargar filtros ni página y se anuncia “La nueva entrega de invitación fue aceptada”; no se afirma entrega final. Cancelación, envío doble, `401/403/404/409/422/503`, respuesta obsoleta y cambio de sesión/empresa no producen éxito local; este último limpia diálogo, selección, error y aviso. No se modificó el mockup; referencia consultada: `docs/frontendMockups/FE-004-users-roles-mockup.html`.

Evidencia: `npm test -- --run src/features/company-users/api.test.ts src/features/company-users/CompanyUsersPageRoute.test.tsx` PASS (10 pruebas); `npm run typecheck` PASS. Cobertura focalizada: endpoint/versión/body, precarga/CTA, reemplazo de una fila y mensaje de aceptación, conflicto sin éxito, cancelación/envío doble, limpieza de sesión, permisos y foco existentes.

Riesgo: `git diff --check` reporta espacio final ajeno en `docs/handoffs/governance/BE-003-dof.md`; no pertenece a FE-043. Reproducción: como `COMPANY_ADMIN`, abrir acciones de una fila `INVITED`, corregir correo y enviar; confirmar `POST` con versión y actualización de esa única fila tras `202`.
