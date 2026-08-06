# Paquete de Contexto — BE-006

## Estado vigente

- HU: `BE-006 — Recuperar contraseña`
- Aplicación: Backend Spring Boot (`backend/followupbussiness`)
- Fase: Cerrada por DoF
- Siguiente fase: Integración por el equipo
- Candidate-ID: `b562037 + a83c1c52d3fa`
- Candidate-ID: `b562037 + 622003b49e75`
- Candidate-ID: `b562037 + 954557e2283f`
- Candidate-ID: `b562037 + 3fd012952a4d`
- Candidate-ID: `b562037 + 679926cfc0b2`
- Riesgo de Seguridad: `APLICA` — recuperación de credenciales, tokens, enumeración de cuentas, revocación de sesiones y aislamiento tenant.

## Criterios normalizados

| ID | Comportamiento verificable | Fuente (ruta/sección) |
|---|---|---|
| BE006-CA1 | Una solicitud sintácticamente válida recibe respuesta neutral aunque la cuenta no exista o no sea utilizable, y los límites de abuso se aplican sin revelar existencia. | `docs/stories/backend/BE-006-recuperar-contrasena.md`, criterio 1; ADR-008, Recuperación y rate limiting |
| BE006-CA2 | Activación y recuperación usan token CSPRNG opaco, persistido solo como digest seguro, con propósito y expiración, consumo serializado de un uso e invalidación latest-wins. | Historia, criterio 2; ADR-008, Recuperación; ADR-017, Límites de dominio |
| BE006-CA3 | La nueva contraseña cumple la política y nunca aparece en URL, logs, auditoría, métricas ni eventos; los errores siguen el contrato neutral. | Historia, criterio 3; ADR-008, Auditoría y política de errores; OpenAPI `PasswordResetRequest` |
| BE006-CA4 | Un reset exitoso consume el token e invalida en la misma transacción todas las familias web/mobile, caches y demás tokens de acción de la cuenta. | Historia, criterio 4; ADR-008, Recuperación y revocación |
| BE006-CA5 | El mismo consumo con propósito `ACTIVATION` establece BCrypt 12, activa una cuenta `INVITED` sin contraseña previa y conserva tenant/roles persistidos. | Historia, criterio 5; ADR-008, Primer acceso |
| BE006-CA6 | La entrega de identidad es durable, cifrada, latest-wins y deduplicada; reintenta con backoff/jitter sin superar expiración, observa fallos sin secretos y evita duplicación desbordada. | Historia, criterio 6; ADR-017, Límites de dominio y operación |

## Dependencias

- `BE-003`: DoF `PASS`; autenticación base integrada. Evidencia: `docs/handoffs/governance/BE-003-dof.md`.
- `EN-013`: DoF `PASS`; ADR-008 y OpenAPI de autenticación estables. Evidencia: `docs/handoffs/governance/EN-013-dof.md`.
- `EN-017`: DoF `PASS`; ADR-017 y contrato de entrega aprobados. Evidencia: `docs/handoffs/governance/EN-017-dof.md`.

## Alcance y contratos afectados

- REST estable: `POST /auth/password-recovery-requests` y `POST /auth/password-resets` en `docs/api/openapi.yaml`; implementar sin cambio silencioso.
- Esquemas/respuestas: `PasswordRecoveryRequest`, `PasswordResetRequest`, `AcceptedResponse`, `PasswordResetInvalid`, `PasswordResetExpired`, `PasswordPolicyViolation`, `AuthRateLimited` y `AuthRateLimiterUnavailable`.
- Backend: dominio `identityaccess`, persistencia Flyway, Redis para rate limit/invalidez, auditoría/telemetría saneada y puerto `IdentityNotificationPort` con adaptador transaccional.
- Política de errores: `application/problem+json`, `correlationId`, `Cache-Control: no-store`, código estable y detalle no sensible; el `202` neutral no devuelve token ni estado de cuenta.

## Decisiones aplicables

- Recuperación: 32 bytes CSPRNG Base64url (43 caracteres), digest HMAC-SHA-256, propósito `PASSWORD_RESET`, expiración exacta de 30 minutos, consumo serializado y nueva emisión invalida la anterior.
- Activación: mismo mecanismo con propósito `ACTIVATION`, expiración de 24 horas, cuenta `INVITED` sin password utilizable; consumo establece BCrypt 12 y estado `ACTIVE` sin asignar tenant/rol desde el token.
- Solicitud neutral: aceptar y responder antes de resolver cuenta/token/entrega; mismo camino observable para existente e inexistente. Límites: 3/h por HMAC de identificador y 20/h por IP; degradación del limitador falla cerrada con `503`.
- Consumo: 5/15 min por digest de token+IP y 30/15 min por IP; inválido/usado/propósito incompatible `400`, expirado `410`, password fuera de política `422`.
- Revocación: reset consume token, incrementa versión de credencial y revoca familias/caches/tokens de acción atómicamente; PostgreSQL es autoridad y el tenant nunca llega como autoridad del cliente.
- Entrega: `identityaccess` solo conoce `IdentityNotificationPort`; trabajo durable cifrado, acceso mínimo, `expiresAt` acotado, latest-wins por tenant+cuenta+propósito, dedupe durable, backoff+jitter y crypto-erase. No evento general ni proveedor nominal en dominio.
- Privacidad: no contraseña, identificador completo, token, enlace, digest, cookie, header de autorización ni payload completo en URL, logs, auditoría, eventos o métricas.

## Controles de Seguridad

No se ejecuta preflight: EN-013, EN-017 y OpenAPI definen sin ambigüedad bloqueante el token, neutralidad, límites, revocación, aislamiento, errores y entrega. Seguridad final validará solo abusos que puedan cambiar su decisión, reutilizando QA.

## Gates vigentes

| Fase | Estado | Artefacto |
|---|---|---|
| Desarrollo | `READY_FOR_HANDOFF` | `docs/handoffs/backend/BE-006-development-handoff.md` |
| QA | `PASS` | `docs/handoffs/backend/BE-006-backend-qa.md` |
| Seguridad | `PASS` | `docs/handoffs/security/BE-006-security-review.md` |
| DoF | `PASS` | `docs/handoffs/governance/BE-006-dof.md` |

## Delta material vigente

Candidate-ID reemplazado tras endurecer predicados terminales: `delivered/retry/erase` posteriores a crypto-erase y erase repetido afectan cero filas y fallan explícitamente. QA/Seguridad revalidan solo esta máquina de estados.
