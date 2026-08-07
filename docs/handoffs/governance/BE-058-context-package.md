# Paquete canónico — BE-058 Gestionar usuarios de empresa

## Estado

- **Candidate-ID pre-Desarrollo:** `HEAD 79870ec + pre-dev-diff 9b660dba3016` (recalculado tras cerrar el delta contractual; rama `feature/first`, cambios ajenos preservados).
- **Gate:** `READY_FOR_HANDOFF`; no hay candidato funcional BE-058 todavía.

## Alcance normalizado

- Actor: identidad autenticada con `COMPANY_ADMIN`; empresa objetivo: únicamente el tenant durable derivado de su sesión, nunca de entrada.
- Operaciones: listar/consultar, invitar (activación de un uso de BE-006), editar datos y rol, bloquear y reactivar usuarios de la propia empresa.
- Éxitos contractuales: lista/consulta `200`, invitación `202`, edición/estado `200`; edición usa `If-Match`; errores son `application/problem+json` con `correlationId`.
- Fuera: registro público, roles personalizados/arbitrarios, rol `PLATFORM_SUPERADMIN`, vendedores y relaciones supervisor-vendedor.
- Criterios: aislamiento tenant; catálogo cerrado; bloqueo revoca acceso y conserva historial; identidad única según contrato de identidad; nunca queda empresa activa sin administrador utilizable; alta/cambios/reactivación auditados.

## Predecesoras y fuentes aplicables

| Elemento | Estado utilizable | Ruta/sección |
|---|---|---|
| BE-006 | `PASS` | `docs/handoffs/governance/BE-006-dof.md`; activación/recuperación y tokens de un uso. |
| BE-007 | contrato/Seguridad final `PASS` (sin DoF integrado) | `docs/handoffs/governance/BE-007-context-package.md`; `docs/handoffs/security/BE-007-security-revalidation-handoff.md`. |
| BE-051 | QA/Seguridad `PASS` (sin DoF integrado) | `docs/handoffs/backend/BE-051-development-handoff-v2.md`; `docs/handoffs/security/BE-051-security-handoff-v3.md`. |
| BE-057 | `PASS` | `docs/handoffs/governance/BE-057-dof.md`; administrador inicial. |
| HU y contrato | aplicables | `docs/stories/backend/BE-058-gestionar-usuarios-de-empresa.md`; `00_CONTRATO_FUNCIONAL.md` HU-003, RN-001/002, RF-AUT-003/005. |
| API | aplicable, con contradicción de rol | `docs/api/openapi.yaml` `/company/users*`, `InviteCompanyUserRequest`, `UpdateCompanyUserRequest`, `ChangeUserStatusRequest`; `docs/api/TRACEABILITY.md` reglas 1--6, 9--11. |
| Seguridad/datos | aplicable | ADR-002; ADR-008 §Logout, bloqueo y revocación / §Auditoría; ADR-011 §Códigos y ámbitos; ADR-020 D1/D2/D5. |

## Decisiones cerradas desde fuente

- `COMPANY_ADMIN` es el único rol mínimo de los endpoints; autorización además verifica empresa y recurso durable. `PLATFORM_SUPERADMIN` no puede asignarse.
- `/company/users` acepta exclusivamente `COMPANY_ADMIN` y `SUPERVISOR`; el esquema público deberá restringirse a esos dos valores durante Desarrollo. `SELLER` queda fuera de BE-058 y reservado para BE-008.
- El catálogo es cerrado y los valores del cliente no conceden autoridad. El tenant procede de la sesión validada.
- El bloqueo/inactivación revoca inmediatamente todas las familias de sesión alcanzadas; PostgreSQL decide, Redis solo acelera tombstones y no puede reactivar. Reactivar no restituye credenciales/sesiones revocadas.
- La auditoría es append-only y transaccional para mutaciones críticas: fallo de auditoría revierte la mutación. Conserva actor/tenant/acción/resultado/recurso/correlación y estados permitidos, no PII ni secretos.
- La unicidad de correo o usuario es tenant-scoped por criterio de BE-058; el conflicto y la versión `If-Match` son `409`. No se declara otra idempotencia para las mutaciones de usuarios.

## Delta contractual aprobado — máquina de estados

- **Aprobación:** `APPROVED`; sustituye el bloqueo del handoff Dev y no altera el alcance de roles ni las respuestas públicas ya contratadas.
- **Administrador utilizable:** exclusivamente una cuenta `COMPANY_ADMIN` en estado `ACTIVE`. `INVITED`, `INACTIVE` y `LOCKED` no cuentan.

| Operación | Transiciones/resultado | Efectos obligatorios y prohibidos |
|---|---|---|
| Invitar | Solo `COMPANY_ADMIN` del tenant invita `COMPANY_ADMIN` o `SUPERVISOR` y crea `INVITED`; identidad duplicada `409`. | Cuenta, único token opaco de activación, notificación y auditoría/outbox se confirman atómicamente. No crea sesión ni credenciales autenticadas. |
| Activar | `INVITED` + token válido no usado → `ACTIVE`; token inválido, expirado o reutilizado se rechaza con la respuesta/error público ya definido. | Token de un uso. El rechazo no cambia estado ni crea sesión/credencial, notifica o registra auditoría de éxito. No aplica la protección de último administrador. |
| Bloquear | `INVITED`/`ACTIVE`/`INACTIVE` → `LOCKED`; `LOCKED` → `LOCKED` es `200` no-op. | La transición efectiva invalida tokens de acción y revoca atómicamente familias, refresh y credenciales; audita. No-op/rechazo no escribe, revoca, publica, notifica ni audita éxito. Último administrador utilizable: `409` sin efectos. |
| Inactivar | `ACTIVE` → `INACTIVE`; `INACTIVE` → `INACTIVE` es `200` no-op; desde `INVITED`/`LOCKED`, `409`. | En transición efectiva, mismos efectos de revocación que bloqueo. Último administrador utilizable: `409` sin efectos; no-op/rechazo sin efectos prohibidos. |
| Reactivar | `LOCKED`/`INACTIVE` → `ACTIVE`; `ACTIVE` → `ACTIVE` es `200` no-op; desde `INVITED`, `409`. | La transición efectiva cambia estado y audita; no crea/restaura sesión, refresh, token de activación ni credencial. No-op/rechazo sin efectos prohibidos. |
| Editar/cambiar rol | Solo cuenta `ACTIVE`, con `If-Match` o versión contractual; versión obsoleta o identidad duplicada `409`. | Retirar `COMPANY_ADMIN` al último administrador utilizable: `409` sin efectos. Rechazo/no-op no modifica cuenta/sesiones/tokens, audita éxito ni publica outbox. |

- Las operaciones que pueden reducir administradores utilizables se serializan por empresa: conteo, transición, auditoría y revocaciones durables comparten frontera transaccional; solo confirma una concurrente que conserva al menos un administrador utilizable.
- Cualquier transición no listada es `409`. Ante fallo durable hay rollback total; tombstones o efectos externos se publican después del commit. La auditoría `DENIED`, cuando aplique, sigue ADR-020 sin PII innecesaria.

## Controles de cierre (matriz anti-rebote)

| Control | Resultado observable | Escrituras/revocaciones | Eventos/auditoría | Sesiones, refresh y credenciales | Prueba de cierre |
|---|---|---|---|---|---|
| C1 Actor, tenant y lectura | `200` solo para `COMPANY_ADMIN` y recursos del tenant; no autenticado `401`, sin permiso/tenant ajeno `403` o `404` visible según contrato. | En rechazo: **ninguno** de cuenta/rol/estado, token de acción, familia de sesión, tombstone Redis, auditoría de éxito, notificación ni publicación/outbox. | Lectura permitida no requiere auditoría; rechazo relevante deja evidencia durable `DENIED` con IDs técnicos/correlación. | No emite, rota ni revoca access/refresh/credenciales. | Negativas no autenticado, rol insuficiente y userId cross-tenant, verificando todos los puertos listados. |
| C2 Invitar y activar | `202` crea `INVITED` con `COMPANY_ADMIN`/`SUPERVISOR` del tenant; duplicado `409`; activación única válida `INVITED→ACTIVE` conserva HTTP/error contractual. Token inválido/expirado/reutilizado no activa. | Invitación exitosa confirma atómicamente cuenta, único token opaco, notificación y outbox/auditoría; rechazos y activación inválida no escriben cuenta/token/notificación/outbox, revocan ni crean sesión. | Invitación exitosa audita; activación inválida no audita éxito; `DENIED` aplicable sin PII. | Invitación y activación no crean sesiones ni credenciales autenticadas; token es de un uso. | Invitación válida; duplicado/rol inválido sin filas/token/notificación/outbox/auditoría éxito; activar una vez y repetir/expirar token sin cambio de estado, sesión, credencial, notificación ni auditoría éxito; dos consumos concurrentes del mismo token confirman exactamente una activación. |
| C3 Editar rol/datos y concurrencia | Solo `ACTIVE` con `If-Match` vigente: `200`; versión/identidad obsoleta y retirada del último `COMPANY_ADMIN` utilizable: `409`. | Éxito modifica solo cuenta/rol y auditoría; conflicto/rechazo/no-op no modifica cuenta/rol/estado/tokens/familias/tombstones, notifica ni publica outbox. Fallo de auditoría revierte cuenta/rol. | Éxito auditado; rechazo relevante `DENIED` sin PII, sin auditoría de éxito/outbox. | Editar/cambiar rol no emite, rota ni revoca credenciales/sesiones. | PATCH vigente; versión/duplicado y retiro del último admin sin efectos; dos retiros concurrentes dejan un admin `ACTIVE`; fallo de auditoría produce rollback total. |
| C4 Estados, revocación y último administrador | Bloquear: `INVITED`/`ACTIVE`/`INACTIVE→LOCKED`, `LOCKED→LOCKED` `200` no-op. Inactivar: `ACTIVE→INACTIVE`, `INACTIVE→INACTIVE` `200` no-op; otros `409`. Reactivar: `LOCKED`/`INACTIVE→ACTIVE`, `ACTIVE→ACTIVE` `200` no-op; `INVITED` `409`. Último admin utilizable o carrera incompatible: `409`. | Bloqueo/inactivación efectivos actualizan estado, invalidan tokens de acción y revocan atómicamente familias, refresh, credenciales y tombstones durables; reactivar solo estado. Rechazo/no-op no escribe, revoca, publica, notifica ni audita éxito. Fallo durable: rollback total; publicación externa tras commit. | Transición efectiva auditada; `DENIED` aplicable sin PII; no-op/rechazo sin auditoría de éxito/outbox. | Reactivar no restaura ni crea sesiones, refresh, tokens o credenciales; usuario vuelve a autenticarse. | Cada transición y transición incompatible; bloqueo/inactivación con sesiones web/móvil; no-op y último admin/carrera sin mutación, revocación, publicación, notificación ni auditoría éxito; fallo durable revierte todo. |
| C5 Datos, PII y observabilidad | Respuestas `User` solo a actor autorizado; errores no contienen datos sensibles. | Persistencia de cuenta conserva solo datos funcionales validados; auditoría conserva IDs/acción/resultado/estado permitido; no persiste payload completo. | Logs/auditoría/eventos omiten PII no necesaria y todo secreto; no hay evento declarado. | Nunca registrar ni exponer contraseña, JWT, refresh, token de acción, cookie, `Authorization`, CSRF o digest. | Inspección/ensayo de éxito y rechazo confirma allowlist de auditoría y ausencia de PII/secreto en sinks. |

### Entradas no confiables y política por sink

| Origen | Sinks durables | Política |
|---|---|---|
| `displayName`, `username`, `email`, `phone` (invite/update) | cuenta | Conservar solo como datos funcionales validados; unicidad de email/usuario por tenant. |
| Los mismos campos | auditoría, logs, eventos/outbox | Omitir; auditoría usa UUID técnico y campos controlados. Sin evento/outbox declarado. |
| `roles`, `status` | cuenta/rol/estado | Categoría aprobada: catálogo cerrado y transiciones contractuales; nunca autoridad por valor recibido. |
| `reason` de estado, `search` | auditoría/logs/eventos | Marcador fijo/categoría saneada; no conservar texto libre. `search` no se persiste. |
| Credenciales/tokens/cabeceras | todo sink durable/observabilidad | Prohibidos: contraseña, JWT, refresh, token de acción, cookie, Authorization, CSRF y digests. |

## Preflight de Seguridad

- **Estado:** `ADVISORY` sobre `HEAD 79870ec + pre-dev-diff 9b660dba3016`; sin contradicciones observables. No se revisó implementación, no se ejecutaron pruebas ni abusos, conforme al alcance previo a Desarrollo.
- Confirma: tenant durable desde sesión y recurso verificado; serialización por empresa de reducciones de administrador; frontera transaccional para estado, revocaciones durables, auditoría y outbox; Redis/entregas externas post-commit sin reactivar credenciales; consumo atómico del token de activación; y ausencia de efectos en rechazo/no-op.
- Riesgo residual implementable: entrega externa post-commit debe reintentarse idempotentemente sin alterar el estado confirmado ni restaurar credenciales.

## Prompt mínimo para Desarrollo (solo tras levantar el bloqueo)

Invoca al agente `backend_developer` con `fork_turns: "none"`. Entrega únicamente: ruta `docs/handoffs/governance/BE-058-context-package.md`; Candidate-ID `HEAD 79870ec + pre-dev-diff 9b660dba3016`; el handoff previo `docs/handoffs/backend/BE-058-development-handoff.md`; y alcance `Implementa BE-058 en identityaccess conforme a la máquina aprobada y los cinco controles C1--C5 completos, incluidos todos los puertos laterales y las pruebas de cierre. Actualiza OpenAPI solo si la decisión contractual lo exige; ejecuta pruebas dirigidas; devuelve/reemplaza el handoff Dev con READY_FOR_HANDOFF o BLOCKED.`
