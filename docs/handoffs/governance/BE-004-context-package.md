# Paquete de Contexto de Historia — BE-004 — v6

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-004-renovar-sesion.md` |
| Commit o diff candidato | `0df537f71e8c6ece12e10d95e6824e5af80255d9`; candidato inmutable resuelto desde Git, sin incluir cambios locales ajenos no preparados. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Registro de versión v6

| Campo | Valor |
|---|---|
| Cambio de candidato | `0df537f` añade exclusivamente `InboundJwtAuthenticatorTest.java`: la prueba altera ahora un carácter significativo de la firma Base64URL, evitando un falso negativo dependiente de bits de relleno. |
| Fuentes primarias | Sin cambio ni relectura; se conserva el alcance normalizado de v1–v5. |
| Controles afectados | `SEC-BE004-01` (rechazo de firma inválida). `SEC-BE004-02..10` no cambian y reutilizan evidencia v5. |
| Manifiesto | `docs/handoffs/governance/BE-004-candidate-v6.sha256` (23 artefactos; SHA-256 `594CA9EBC98E0F911DA0E2188C80755CC79F9C1EE2423A9B8E1D1533F8CAF575`). |
| Ruta acotada | QA afectado → Seguridad final → DoF. No se reinicia la historia. |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE004-AC01 | Un refresh válido de la familia activa devuelve access nuevo y un único refresh sucesor por el canal contratado. | BE-004, Criterios de aceptación 1; ADR-008, «Refresh token, familia y rotación» | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC02 | Un refresh de familia revocada, expirado o inválido no renueva ni expone identidad, tenant, rol o sucesor. | BE-004, Criterios 2 y Seguridad; ADR-008, tabla de resultados | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC03 | La rotación conserva la expiración absoluta de 30 días y no la extiende. | BE-004, Criterio 3; ADR-008, «Refresh token, familia y rotación» | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC04 | Cada resultado crítico de refresh queda auditado y es trazable mediante correlationId sin secretos ni PII completa. | BE-004, Criterio 4 y Observabilidad; ADR-008, «Auditoría y observabilidad» | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| RF-AUT-004 | Cerrar o renovar sesiones de forma segura. | `00_CONTRATO_FUNCIONAL.md`, RF-AUT-004 | Renovación solo por credencial válida y con respuesta segura. |
| ADR8-REFRESH | Refresh opaco de 32 bytes, digest HMAC-SHA-256; familia expira a 30 días; el uso consume y rota transaccionalmente una sola fila. | ADR-008, «Refresh token, familia y rotación» | No persistir ni registrar el secreto; CAS/bloqueo que impida dos sucesores. |
| ADR8-REPLAY | Segundo uso <=5 s mismo canal/cliente devuelve `409 REFRESH_ALREADY_ROTATED`; cualquier otro replay revoca la familia y responde `401 REFRESH_TOKEN_REUSED`. | ADR-008, «Refresh token, familia y rotación» | Clasificar concurrencia en PostgreSQL y revocar antes de responder el replay malicioso. |
| ADR8-CHANNEL | WEB usa cookie HttpOnly y CSRF; MOBILE usa body sin contexto navegador; canal/cliente no son autoridad y deben coincidir con la familia. | ADR-008, «Canales web y mobile»; OpenAPI `/auth/refresh` | Rechazar downgrade y validar canal antes de credenciales. |
| ADR8-IDENTITY | Access JWT RS256 de 10 min, claims mínimos; tenant y rol se derivan de relaciones persistidas. | ADR-008, «Credencial de acceso» | Emitir access desde cuenta/familia persistidas; ningún valor de cliente concede identidad, tenant o rol. |
| ADR8-REVOCATION | PostgreSQL decide familia activa; una revocación es inmediata y Redis no puede reactivarla. | ADR-008, «Logout, bloqueo y revocación» | Consultas y mutaciones restringidas a familia/cuenta/tenant persistidos. |
| ADR8-LIMIT | Refresh: 30/min por familia+IP; desconocido: digest presentado+IP y 120/min IP; fail closed `503` si Redis no está disponible. | ADR-008, «Rate limiting y abuso» | Claves HMAC, `429`/`Retry-After`; no mutar ni revelar datos si falla el limitador. |
| ADR8-OBS | Auditar refresh exitoso/rotado/reutilizado y no incluir tokens, JWT, cookies, CSRF, digests ni payloads. | ADR-008, «Auditoría y observabilidad» | Evento/auditoría y métrica saneados con correlationId y campos técnicos mínimos. |
| ADR20-AUDIT | Auditoría append-only, tenant del contexto confiable, campos minimizados y trazabilidad en éxito/error. | ADR-020, D1 y reglas de aislamiento | Usar puerto público o adaptador explícito; no acceso directo a tabla de otro dominio. |
| ENG-TENANT | Consultas y cache no cruzan tenant; observabilidad conserva correlationId, tenant técnico, userId, operación, resultado, latencia y error. | `shared/ENGINEERING_RULES.md`, §§3 y 7 | Aplicar filtro tenant derivado y telemetría saneada. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| REST/OpenAPI estable | `docs/api/openapi.yaml`, `/auth/refresh`, `AuthClient`, `MobileRefreshSessionRequest`, respuestas refresh | Implementar sin cambiar el contrato; `200/400/401/403/409/429/503`, `no-store`, correlationId y transporte por canal. | FE-003, MOB-002, INT-002, INT-003 |
| Backend | `identityaccess` application/ports/adapters/config | Caso de uso refresh, rotación persistente, limitador, auditoría/telemetría y endpoint. | Backend auth, filtros JWT |
| Persistencia | nueva migración Flyway; familia de sesión y tokens de refresh | Tabla/columnas forward-only para historial de tokens consumidos y CAS transaccional. | PostgreSQL, autenticación |
| Seguridad | `SecurityConfiguration`, origen/CORS/CSRF | Permitir exclusivamente refresh bajo sus controles contractuales. | Clientes WEB y MOBILE |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Renovación, rotación y replay de refresh | En alcance, alto | BE-004; ADR-008 |
| Revocación de familia al detectar reutilización | En alcance, alto | ADR-008 |
| Firma y claims de access emitido tras refresh | En alcance, alto | ADR-008; OpenAPI |
| Límite de refresh, Redis degradado y concurrencia | En alcance, alto | ADR-008 |
| Auditoría/observabilidad y privacidad | En alcance, alto | BE-004; ADR-008; ADR-020 |
| Logout, cierre pendiente y revocación administrativa | Fuera de implementación salvo soporte estrictamente necesario | BE-005 / ADR-008 |
| Registro, roles arbitrarios y autenticación social | Fuera de alcance | BE-004, «Fuera de alcance» |

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| ADVISORY | Antes de Desarrollo; superficie de autenticación, autorización, multiempresa, Redis y auditoría. | `docs/handoffs/security/BE-004-preflight.md` |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-BE004-01 | Forgery o emisión insegura de access. | Fijar RS256 y `kid` conocido; derivar claims de persistencia; 10 min y claims contractuales, sin `tid` de plataforma. | Verificar firma/claims y rechazar cuenta, empresa o sesión no activas. | Sí |
| SEC-BE004-02 | Exposición de refresh/CSRF o downgrade WEB↔MOBILE. | CSPRNG 32 bytes/digest HMAC; validar Origin, canal y CSRF antes de consultar credenciales; WEB cookie y MOBILE body exclusivos. | Matriz WEB/MOBILE y ausencia de secretos en JSON, logs y persistencia. | Sí |
| SEC-BE004-03 | Replay y doble sucesor. | CAS/bloqueo y restricción persistente que permitan un único sucesor incluso entre instancias. | Dos solicitudes sincronizadas: una renovación, una respuesta contractual y exactamente un sucesor. | Sí |
| SEC-BE004-04 | Sesión robada o refresh reutilizado. | Clasificar ventana de 5 s por canal+cliente; fuera de ella revocar familia en la misma transacción. | Replay tardío/canal distinto/cliente distinto: `401 REFRESH_TOKEN_REUSED`, familia revocada y sin credenciales. | Sí |
| SEC-BE004-05 | Sesión perpetua o revocada renovable. | Verificar expiración absoluta y revocación en PostgreSQL; no recalcular 30 días al rotar. | Expirado/revocado no renueva; sucesor mantiene `expires_at` original. | Sí |
| SEC-BE004-06 | Suplantación/cruce de tenant, rol o cuenta. | Ignorar autoridad de body/headers y exigir relación activa, persistida y no ambigua. | Inyectar valores; probar plataforma, empresa inactiva y relaciones múltiples sin token indebido. | Sí |
| SEC-BE004-07 | Abuso/agotamiento o degradación de Redis. | Incrementos Redis atómicos/TTL y claves HMAC; IP solo de proxy confiable; evaluar límites antes de PostgreSQL y fail closed. | Umbrales, spoof de IP y Redis caído/lento: `429`/`503` con cero mutaciones. | Sí |
| SEC-BE004-08 | Enumeración o fuga de información. | CorrelationId saneado/acotado, `no-store` y `Pragma` en todos los resultados; no cookie en fallos ni MOBILE. | Errores comparables, sin datos/secretos; correlationId CRLF o sobredimensionado. | Sí |
| SEC-BE004-09 | Falta de evidencia o fuga en observabilidad. | Allowlist para auditoría/logs/métricas; sin request, headers, cookies, payload, tokens o labels no acotados. | Éxito, carrera, replay, inválido, rate limit e infraestructura; búsqueda de marcadores secretos. | Sí |
| SEC-BE004-10 | Carrera entre consumo, auditoría y revocación. | Consumo, sucesor, revocación y auditoría crítica confirman o revierten juntos; nunca responder antes del commit. | Fallos inyectados alrededor de sucesor/auditoría; rollback, sin segundo sucesor ni `200` inconsistente. | Sí |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Preflight Seguridad | Este paquete, sin código BE-004 | `ADVISORY` + validación de matriz `SEC-*` | Controles verificables |
| Desarrollo | Este paquete + preflight | Handoff `READY_FOR_HANDOFF` | Implementación y pruebas dirigidas por control |
| QA | Paquete + handoff Dev + candidato | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Matriz criterio → prueba |
| Seguridad | Paquete + handoff Dev + QA + candidato | `PASS`/otro estado | Revisión completa de `SEC-*` |
| DoF | Paquete + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Misma versión candidata |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de hash invalida este paquete y requiere una nueva versión del Orquestador.

## Ruta de remediación

Un hallazgo de Seguridad no reinicia la HU. Crear una nueva versión del paquete solo para el candidato y controles afectados, y recorrer `Dev de remediación → QA afectado → Seguridad final → DoF`. Reutilizar evidencia inmutable de controles no afectados y documentar la decisión.
