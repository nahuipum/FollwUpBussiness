# Paquete de contexto — BE-063 / FE-043

Estado actual: `PASS`  
Candidate-ID: `71a31cc + 68a518fe` (digest corto conjunto BE-063/FE-043).

## Contrato y alcance

- `POST /company/users/{userId}/invitation`; sólo `COMPANY_ADMIN`; `If-Match` obligatorio y vigente.
- Request: `displayName`, `email`, `role` (`COMPANY_ADMIN|SUPERVISOR`) y `username` opcional. Éxito `202` con el mismo `User`, sin secretos ni enlaces.
- La operación afecta exclusivamente a la cuenta `INVITED` del tenant de sesión. `ACTIVE`, `INACTIVE` y `LOCKED` devuelven `409` sin efectos. No altera la edición de cuentas `ACTIVE`.
- Conserva `userId`; unicidad de email/login por tenant excluye el mismo usuario. Un reenvío sin cambios sustituye igualmente el token de activación.
- Cuenta, token previo invalidado/nuevo, auditoría y solicitud durable de notificación son atómicos. La entrega se procesa tras commit. Fallos de conflicto, versión, auditoría, persistencia u outbox no dejan mutaciones parciales.
- Actor y tenant proceden exclusivamente de la sesión. No registrar/devolver token, enlace, credenciales o PII innecesaria.

## Invariantes y puertos alcanzables

| Control | Evidencia esperada |
|---|---|
| Actor/recurso | Admin del tenant; rechazo SUPERVISOR/sin sesión y `userId` cross-tenant. |
| Éxito | Misma fila/`userId`, datos y rol permitidos, `202`, token anterior inválido y nuevo durable. |
| Conflicto | Estados no `INVITED`, duplicados tenant-scoped y `If-Match` obsoleto: `409`, sin cambios. |
| Validación | Request y rol fuera del conjunto cerrado: `400/422`, sin efectos. |
| Falla/rollback | Auditoría, token/notificación u outbox fallidos revierten cuenta, token y eventos. |

Puertos: `CompanyUserService`/caso de uso, persistencia de cuentas, `PasswordRecoveryPort`, `IdentityNotificationPort`, `AuditEntryStore`, `OutboxStore`, REST controller y contexto de autenticación. La entrega externa queda fuera de la transacción.

## Frontend

- En la tabla existente: `INVITED` muestra **Corregir y reenviar invitación** y mantiene bloquear/cancelar con confirmación; `ACTIVE` conserva Editar/Bloquear; `LOCKED|INACTIVE` Reactivar y acciones FE-004.
- Reutilizar `CompanyUserInviteDialog` precargado; título/CTA específicos. Invocar sólo el endpoint nuevo con versión. En `202`, sustituir únicamente esa fila, sin cambiar filtros/página, y mostrar aceptación, no entrega final.
- Evitar doble envío; cancelar, respuestas 401/403/404/409/422/503 u obsoletas no generan éxito local. Limpiar diálogo, selección, errores y resultado al logout/cambio de empresa.

## Archivos inicialmente identificados

- Backend: `identityaccess/application/CompanyUserService.java`, `adapter/in/rest/CompanyUserController.java`, puertos/adaptadores de recuperación, notificación, auditoría y outbox; sus pruebas `CompanyUserServiceTest`, `CompanyUserControllerTest`, integración de persistencia.
- Frontend: `src/features/company-users/{api.ts,hooks/useCompanyUsers.ts,components/CompanyUsersPage.tsx,components/CompanyUsersTable.tsx,components/CompanyUserInviteDialog.tsx}` y pruebas cercanas.

## Verificación requerida

- Backend: focalizadas, `HexagonalArchitectureTest`, `ModuleBoundaryTest`, `mvn -q clean verify`.
- Frontend: focalizadas, type-check y lint/build si se modifica composición compartida.
- QA valida toda la matriz; Seguridad reproduce tenant cruzado, rol de plataforma, token previo y fugas. DoF sólo coteja candidato, artefactos, evidencias y `git diff --check`.

## Delta de Desarrollo

- Implementado el reenvío transaccional para la cuenta `INVITED`, con `If-Match` entrecomillado, tenant/actor de sesión, renovación de token y notificación durable, auditoría y outbox.
- Focalizadas y arquitectura: PASS. `mvn -q clean verify` alcanzó pruebas y falló sólo al iniciar el contenedor de `RefreshSessionTransactionIntegrationTest`; no hay fallo funcional atribuido a BE-063.
- FE-043 añade el único `POST /company/users/{userId}/invitation` con `If-Match` entrecomillado, menú condicionado por `INVITED` y diálogo reutilizado precargado. Sólo con `202` reemplaza la fila y comunica aceptación de entrega; sesión/empresa limpia diálogo, selección, error y aviso.

## Delta QA Frontend

- `PASS` para `71a31cc + 68a518fe`: menú y modal por estado, permiso de supervisor, endpoint/versión, actualización exclusiva de fila, errores/obsolescencia/doble envío y limpieza de sesión validados.
- `npm test -- --run src/features/company-users/api.test.ts src/features/company-users/CompanyUsersPageRoute.test.tsx` (10 PASS) y `npm run typecheck` (PASS). No hay token, enlace ni rol de plataforma en la superficie FE-043.

## Corrección de trazabilidad

- El único Candidate-ID vigente del árbol combinado BE-063/FE-043 es `71a31cc + 68a518fe`. Se sustituye la referencia local previa `71a31cc + 09ecdb6b` del handoff backend; `68a518fe` incorpora la composición de FE-043 y no modifica el alcance backend ni su evidencia.

## Delta QA Backend final

- `PASS` para `71a31cc + 68a518fe`. Queda cerrado el bloqueo de trazabilidad: paquete, handoff de Desarrollo y QA refieren el mismo candidato; el árbol combinado permanece sin commit conforme al Candidate-ID.
- Reutilizada evidencia focalizada PASS de `CompanyUserServiceTest`, `CompanyUserControllerTest`, `CompanyUserPostgresIntegrationTest`, `HexagonalArchitectureTest` y `ModuleBoundaryTest`, además de `git diff --check` para el alcance BE-063.
- `mvn -q clean verify` no es concluyente por el arranque de Testcontainers en `RefreshSessionTransactionIntegrationTest`, ajeno a BE-063; no se ejecutaron pruebas adicionales en esta revalidación documental.

## Delta Security final

- Estado Security: `PASS` para `71a31cc + 68a518fe`; ambos handoffs QA están en `PASS` y no hay hallazgos abiertos.
- Se reutilizó la evidencia del mismo candidato sobre autorización/tenant, roles cerrados, invalidación de token, cifrado de notificación, ausencia de secretos, atomicidad y limpieza FE.
- Reproducción de abuso `NOT_EXECUTED` en esta revalidación: el ajuste fue sólo de metadatos, sin cambio de código, superficie, amenaza o control.
