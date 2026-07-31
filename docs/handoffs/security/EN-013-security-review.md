# Revalidación administrativa final de Ciberseguridad — EN-013

## Estado

`PASS`

La aceptación humana añadida al ADR es válida y no altera el diseño de
seguridad aprobado. ADR-008 figura `Aceptado` mediante **Decisión A**, con
**Luis Siancas — Owner**, fecha **2026-07-31 (America/Lima)** y alcance limitado
a estabilizar EN-013 y desbloquear sus consumidores. El bloque excluye
expresamente aprobar o iniciar EN-017 y no sustituye las validaciones de las
historias implementadoras.

Los hallazgos `SEC-EN013-001..005` quedan cerrados documentalmente. El cierre
final de `SEC-EN013-004` separa de forma implementable el logout local y la
revocación remota: WEB no pretende borrar desde JavaScript la cookie HttpOnly y
MOBILE conserva únicamente un ticket opaco con capacidad limitada a revocar su
propia familia.

`X-Logout-Intent` no reabre CSRF/CORS: exige `PENDING`, cookie SameSite Strict y
Origin exacto allowlisted; su preflight solo se permite para
`POST /auth/logout`. La operación no rota ni devuelve credenciales, identidad o
datos, no admite `allSessions=true` y siempre ordena al servidor borrar la
cookie. No quedan hallazgos Critical, High, Medium o Low abiertos en el alcance
documental EN-013.

Este `PASS` aprueba el diseño y contrato del snapshot. No acredita endpoints,
Redis/PostgreSQL, CORS de navegador, secure storage ni carreras runtime de las
historias implementadoras.

## Snapshot y alcance

- QA previo: `PASS` en `docs/handoffs/backend/EN-013-backend-qa.md`.
- HEAD contenedor: `50c02f89e5907a10b2ec78f0a41a9a392db8595f`.
- Remediación no committeada, fijada por huellas verificadas:
  - ADR-008 aceptado: `D41A81A8A144A235011A6006C1043EFBD7541A11C419BD91CCD0FF13D96A5D54`.
  - OpenAPI: `AB1265F81658F3B4FEAC6C810CF2025AD29AD5A4D18965A5D3B35DF9DE911D46`.
  - prueba: `3CC845BA95255CD6A6EE944AC707E0B9E6092072B567C85D43B846CF3D2BECB3`.
- Las tres huellas coinciden con el handoff de remediación y QA final. Los
  handoffs y cambios ajenos del worktree no se atribuyeron a EN-013.

El retest cubrió nuevamente historia/ADR, handoffs Desarrollo/QA, diff
remediado, `/auth/*`, esquemas/headers/security schemes OpenAPI, prueba
contractual, reglas funcionales y controles compartidos aplicables. Se atacó
en particular `X-Logout-Intent`, CORS/preflight, cookie HttpOnly, ticket mobile,
replay, alcance de familia, tenant, respuesta y almacenamiento.

La revalidación administrativa final comprobó además `Estado`, Decisión A,
responsable, fecha y alcance. Al revertir solo `Aceptado`→`Propuesto` y retirar
en memoria el bloque `Aceptación`, el contenido reconstruido obtiene exactamente
el hash previamente aprobado
`C10B2F4F50CC1535E4BDAC4A969ADA82E722F9DBDDD0A7C664410F7CDD392B58`.
Por tanto no existe otro delta funcional o de seguridad en ADR-008.

No se modificaron ADR, OpenAPI, código, pruebas, dependencias, configuración ni
EN-017. Este handoff es el único artefacto actualizado por Seguridad.

## Modelo de amenazas del retest

**Activos:** contraseña, JWT, refresh/action tokens, cookie/CSRF web,
`sessionRevocationTicket`, secure storage mobile, familia/revocación,
cuenta/tenant/rol, claves RS256/HMAC, auditoría y disponibilidad de auth.

**Actores:** atacante anónimo distribuido, sitio cross-origin, XSS en origen
permitido, ladrón de token/ticket, dispositivo sin red o comprometido, usuario
que cierra sesión, Backend, PostgreSQL, Redis y futuro worker EN-017.

**Límites de confianza:** navegador/mobile → REST; JavaScript ↔ cookie HttpOnly;
Origin/preflight → política CORS; cliente offline → servidor; ticket/cookie →
familia; filtro access → PostgreSQL/Redis; solicitud genérica → worker; y
separación plataforma/tenant/cuenta/familia.

## Cierre de SEC-EN013-001..005

| Hallazgo original | Evidencia y repetición del abuso | Estado |
|---|---|---|
| `SEC-001` **High** — login distribuido | Límite acumulativo por identificador canónico independiente de IP, además de identidad+IP e IP; aplica a inexistentes sin cambiar cuenta. N IP ya no multiplican sin límite el presupuesto. Refresh desconocido añade digest+IP y `120/min` por IP. | `CLOSED_DOCUMENTALLY`; runtime `NOT_EXECUTED` |
| `SEC-002` **Medium** — Redis stale | Cada aceptación access consulta familia, cuenta y tenant en PostgreSQL. Redis solo guarda tombstones, nunca `ACTIVE`; fallo/stale no crea autorización. | `CLOSED_DOCUMENTALLY`; runtime `NOT_EXECUTED` |
| `SEC-003` **Medium** — timing recovery | El endpoint acepta la solicitud genérica y responde antes de resolver cuenta/token/notificación; existentes e inexistentes comparten rate limit, presupuesto y camino observable. | `CLOSED_DOCUMENTALLY`; timing runtime `NOT_EXECUTED` |
| `SEC-004` **Medium** — logout defensivo | WEB limpia estado JS y bloquea refresh; servidor borra cookie. Reintento WEB solo revoca la familia de la cookie. MOBILE elimina access/refresh y conserva ticket one-use, family-bound, no autenticante. La cuota no niega logout. | `CLOSED_DOCUMENTALLY`; navegador/mobile runtime `NOT_EXECUTED` |
| `SEC-005` **Low** — error 422 | Reset usa `PasswordPolicyViolation` y `x-error-codes: [PASSWORD_POLICY_VIOLATION]`; la prueba lo exige. | `CLOSED_DOCUMENTALLY` |

## Abuso dirigido de `X-Logout-Intent`, CORS y ticket mobile

| Escenario intentado | Control verificable | Resultado |
|---|---|---|
| Sitio no permitido envía cookie y `X-Logout-Intent` | Cookie `SameSite=Strict`; custom header fuerza preflight; Origin sin allowlist no recibe CORS | `MITIGATED_DOCUMENTALLY` |
| Origen permitido usa header en método/ruta distinta | ADR limita preflight a Origin exacto y `POST /auth/logout`; el header no concede auth ni habilita otros endpoints | `MITIGATED_DOCUMENTALLY` |
| Origen permitido solicita refresh mediante intent | Forma pendiente solo revoca/borrar; nunca rota, renueva o devuelve access/refresh/CSRF/datos | `MITIGATED_DOCUMENTALLY` |
| Atacante fuerza logout global con cookie | Forma WEB pendiente rechaza `allSessions=true` y solo alcanza la familia resuelta por la cookie | `MITIGATED_DOCUMENTALLY` |
| Se combina intent con access, ticket o credenciales incompatibles | ADR define tres formas mutuamente excluyentes; cookie/access/ticket no se mezclan en las formas pendientes | `MITIGATED_DOCUMENTALLY` |
| Replay de cookie tras revocación o respuesta perdida | Logout idempotente devuelve `204`; cookie se limpia; PostgreSQL mantiene familia revocada | `MITIGATED_DOCUMENTALLY` |
| Ticket mobile robado | 32 bytes, HMAC separado, one-use, expira/invalida con familia; solo provoca logout de esa familia, sin identidad/tenant/rol ni sesión | `MITIGATED_DOCUMENTALLY`; extracción runtime pendiente |
| Ticket aleatorio o de otra familia/tenant | Resolución por HMAC de alta entropía y binding persistido; no acepta tenant del cliente ni `allSessions` | `MITIGATED_DOCUMENTALLY` |
| Mobile pierde red después de logout local | Access/refresh se eliminan y tracking se detiene; solo queda ticket de revocación en secure storage hasta `204` | `MITIGATED_DOCUMENTALLY`; retry runtime pendiente |

La exención de CSRF de la forma WEB pendiente es aceptable porque la capacidad
se reduce estrictamente a cerrar la propia familia y borrar la cookie. CORS no
se considera autenticación: la autoridad sigue siendo la cookie/familia
persistida y la operación no produce datos ni credenciales.

## Set completo de controles

| Control | Resultado documental | Runtime |
|---|---|---|
| Enumeración, reset y separación EN-017 | `PASS`: solicitud genérica; tokens opacos HMAC/un uso; proveedor fuera de alcance | `NOT_EXECUTED` |
| Login y fuerza bruta | `PASS`: identificador canónico independiente de IP, capas IP/combinada y respuesta neutral | `NOT_EXECUTED` |
| Refresh, robo, replay y carrera | `PASS`: CAS, sucesor no reemitido, ventana 5 s y reuse revoca familia | `NOT_EXECUTED` |
| Revocación Redis/PostgreSQL | `PASS`: PostgreSQL por access; Redis solo tombstones | `NOT_EXECUTED` |
| Logout web/mobile | `PASS`: tres formas excluyentes, revocación acotada, limpieza local y ticket limitado | `NOT_EXECUTED` |
| CSRF, CORS, cookie y downgrade | `PASS`: allowlist exacta, preflight acotado, SameSite, CSRF normal y Origin/Sec-Fetch anti-MOBILE | `NOT_EXECUTED` |
| BOLA, tenant y roles | `PASS`: autoridad persistida, queries/keys tenant-bound, sin tenant aportado por cliente/token de acción | `NOT_EXECUTED` |
| Secretos, logs y auditoría | `PASS`: JWT sin PII; HMAC/secrets/payloads excluidos; ticket no expone identidad | `NOT_EXECUTED` |
| Rate limit y degradación | `PASS`: SEC-001 cerrado; auth falla cerrada; cuota no niega revocación | `NOT_EXECUTED` |
| Errores y compatibilidad OpenAPI | `PASS`: errores tipados, ticket/header declarados y refresh WEB ausente del JSON | lint/prueba QA `PASS` |

## Evidencia y ejecución

| Evidencia | Resultado |
|---|---|
| SHA-256 y `git status --short` | `PASS`; ADR final `D41A...5D54`, OpenAPI `AB12...1D46` y prueba `3CC8...ECB3` coinciden con QA |
| Reconstrucción en memoria del ADR sin aceptación | `PASS`; recupera exactamente `C10B...2B58`, demostrando delta solo administrativo |
| Estado/Decisión/responsable/fecha/alcance | `PASS`; A, Luis Siancas — Owner, 2026-07-31 America/Lima; no aprueba/inicia EN-017 ni sustituye gates |
| Diff ADR-008/OpenAPI/prueba | `PASS`; cierre trazable de SEC-001..005 y CORS de `X-Logout-Intent` |
| QA focalizada sobre las mismas huellas | Reutilizada: `PASS`, 7/7 pruebas |
| Redocly sobre OpenAPI `AB1265...` | Reutilizado: `PASS`, sin errores/warnings |
| Revisión manual de formas logout y preflight | `PASS` documental; no se encontró bypass que emita sesión/datos o amplíe tenant/familia |
| CORS navegador, timeout/reinicio, ticket, DB↔Redis, rate distribuido y timing | `NOT_EXECUTED`: no existe implementación EN-013 |
| SAST/SCA/DAST/secret scan general | `NOT_EXECUTED`: diff documental/contractual sin código productivo, dependencias o infraestructura |

No se repitieron Maven ni lint: OpenAPI y prueba conservan exactamente las
huellas del último `PASS`, y el único delta ADR es administrativo.

## Controles no aplicables

- WebSocket, geolocalización salvo detención al logout, archivos,
  RabbitMQ/DLQ, importaciones y mensajería externa: sin cambio EN-013.
- Dependencias, SBOM, imágenes, contenedores, CI/CD, puertos y configuración
  productiva Redis/TLS/proxy: sin diff EN-013.
- Selección de proveedor, canal y contenido anti-phishing: EN-017 no fue
  iniciado ni modificado.
- SQL injection, mass assignment y DAST: no existen endpoints implementados.

## Riesgos residuales

- Todos los cierres son documentales. BE-003..006/FE-003/MOB-002 deben probar
  preflight real por Origin/método/ruta, combinaciones incompatibles, cookie
  persistente, ticket one-use/replay, reinicio y extracción de almacenamiento.
- También permanecen `NOT_EXECUTED` distribución multi-IP, normalización,
  tombstones/carrera DB↔Redis, timing recovery, CAS/reuse y BOLA runtime.
- XSS en un Origin permitido puede provocar logout y usar access/CSRF mientras
  existan; no puede convertir `X-Logout-Intent` en login/refresh según contrato.
- Un ticket mobile robado permite como máximo revocar su propia familia; el
  riesgo de disponibilidad queda aceptado por la capacidad limitada y debe
  observarse sin registrar el ticket.
- Gestión de claves, TLS/WAF, confianza en IP/proxy, auditoría operativa y
  notificación EN-017 requieren controles posteriores.
- Antes de DoF, el worktree debe fijarse en un snapshot inmutable conservando
  exactamente las tres huellas de este retest.

Resultado final: `PASS`.
