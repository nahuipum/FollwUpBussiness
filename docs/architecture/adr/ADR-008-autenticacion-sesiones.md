# ADR-008 — Autenticación, sesiones y recuperación

**Estado:** Aceptado
**Historia:** EN-013
**Dominio propietario:** `identityaccess`

## Aceptación

- **Decisión:** A — aceptar ADR-008 y el OpenAPI revisado como contrato estable de EN-013.
- **Responsable humano de Arquitectura:** Luis Siancas — Owner.
- **Fecha:** 2026-07-31 (America/Lima).
- **Alcance:** desbloquea las historias dependientes de EN-013 para consumir este contrato sin modificarlo silenciosamente. No aprueba ni inicia EN-017, ni sustituye las validaciones de implementación de BE-003 a BE-006, FE-001 a FE-003 o MOB-001 a MOB-002.

## Contexto

FollowUpBussiness necesita una política única de autenticación para el panel web y la aplicación móvil antes de implementar BE-003 a BE-006. EN-010 dejó Spring Security en denegación por defecto y reservó esta decisión. EN-011 estabilizó los roles base y EN-012 creó, sin endpoint público, la primera cuenta de plataforma con BCrypt 12.

El contrato funcional exige login por correo o nombre de usuario, sesiones renovables y revocables, bloqueo de cuentas, recuperación de contraseña, ausencia de registro público, activación temporal de un solo uso, aislamiento multiempresa y auditoría. Web y mobile comparten autoridad de servidor, pero sus mecanismos de almacenamiento tienen amenazas distintas. El canal elegido por el cliente no puede convertirse en autoridad de identidad, tenant o rol ni permitir que JavaScript obtenga un refresh token web.

EN-013 define el contrato y la evolución de datos. No implementa endpoints, migraciones, pantallas ni proveedor de notificaciones.

## Decisión

### Credencial de acceso

El access token será un JWT firmado asimétricamente con `RS256`:

- duración exacta: 10 minutos;
- tolerancia máxima de reloj: 60 segundos;
- transporte exclusivo: `Authorization: Bearer <token>`;
- nunca se almacena en cookies;
- cabecera obligatoria `kid` para rotación de claves;
- claims mínimos: `iss`, `aud`, `sub` (UUID de cuenta), `sid` (UUID de familia de sesión), `jti`, `iat`, `nbf`, `exp`, `roles` y, solo para cuentas de empresa, `tid`;
- no incluye correo, nombre, documento, permisos detallados ni otros datos personales.

`tid` se deriva de la cuenta persistida. Su ausencia solo es válida para un rol de ámbito plataforma. Un rol o tenant declarados por el cliente nunca son autoridad. El backend valida en cada solicitud la firma, audiencia, emisor, tiempo, estado de la familia, cuenta, empresa y autorización por recurso; los claims no sustituyen las relaciones persistidas.

Las claves privadas llegan por el mecanismo de secretos del ambiente y nunca se versionan. La clave pública anterior permanece disponible al menos 11 minutos después de dejar de firmar (duración del token más tolerancia) para permitir una rotación sin corte. El algoritmo `none`, claves simétricas compartidas con clientes y selección de algoritmo desde el token se rechazan.

### Refresh token, familia y rotación

El refresh token será opaco, generado con 32 bytes aleatorios criptográficamente seguros y codificado Base64url sin padding (43 caracteres). Su valor solo existe en el cliente y en la respuesta que lo emite. PostgreSQL almacena un digest `HMAC-SHA-256` con una clave separada entregada como secreto; nunca texto plano, JWT ni datos personales.

Cada login crea una familia de sesión con expiración absoluta de 30 días. La rotación no amplía ese límite. Cada uso válido consume el token mediante una actualización transaccional de una sola fila y emite exactamente un sucesor de la misma familia, canal y cliente. Los tokens consumidos se conservan hasta que expire la familia para detectar reutilización.

Dos usos del mismo token se tratan así:

1. El primero gana el bloqueo/compare-and-set, consume el token y rota.
2. Un segundo uso dentro de 5 segundos, desde el mismo canal y el mismo `clientInstanceId`, responde `409 REFRESH_ALREADY_ROTATED`, no devuelve ni reemite el sucesor y no revoca la familia. El cliente conserva la respuesta ganadora; si la perdió, debe volver a autenticarse.
3. Un uso posterior a esa ventana o con canal/cliente distinto se considera robo o reutilización: revoca toda la familia, invalida su cache y responde `401 REFRESH_TOKEN_REUSED`.

La ventana solo evita falsos positivos por concurrencia inmediata; no convierte refresh en una operación idempotente. `clientInstanceId` es un UUID estable por instalación/perfil, se persiste como digest y ayuda a clasificar concurrencia, pero no autentica, no autoriza y no reemplaza el token.

Otros resultados de renovación son:

| Condición | HTTP y código |
|---|---|
| Token válido | `200`; access nuevo y refresh rotado |
| Token/familia expirado | `401 REFRESH_TOKEN_EXPIRED` |
| Token desconocido, revocado o canal incompatible | `401 REFRESH_TOKEN_INVALID` |
| Rotación concurrente controlada | `409 REFRESH_ALREADY_ROTATED` |
| Reutilización/robo | `401 REFRESH_TOKEN_REUSED`; familia revocada |
| Rate limit excedido | `429 AUTH_RATE_LIMITED` |
| Rate limiter no disponible | `503 AUTH_RATE_LIMIT_UNAVAILABLE` |

Las respuestas no revelan cuenta, tenant, rol ni estado empresarial.

### Canales web y mobile

`X-Auth-Client: WEB|MOBILE` y `X-Client-Instance-Id` hacen explícito el contrato de transporte. No son credenciales ni autoridad. Se aplican estas invariantes:

- cualquier petición con `Origin` se trata exclusivamente como navegador;
- `Origin` debe pertenecer a la allowlist exacta del ambiente, sin comodines;
- una petición con `Origin` o metadata `Sec-Fetch-*` que declare `MOBILE` se rechaza con `400 AUTH_CLIENT_CHANNEL_INVALID` antes de leer credenciales;
- `WEB` requiere `Origin` permitido;
- `MOBILE` solo se admite sin contexto de navegador (`Origin` y `Sec-Fetch-*` ausentes);
- el canal persistido en la familia debe coincidir en cada rotación;
- un refresh web presentado en body nunca se acepta como mobile y una cookie web nunca produce una respuesta mobile.

Para web:

- el access token se devuelve en JSON y vive solo en memoria;
- el refresh token se entrega exclusivamente en `Set-Cookie: __Host-fs-refresh=...; Path=/; Secure; HttpOnly; SameSite=Strict`;
- el JSON web no contiene propiedad `refreshToken`;
- el servidor ignora la cookie fuera de `/auth/refresh` y `/auth/logout`;
- login y cada refresh exitoso devuelven un token CSRF nuevo en el JSON;
- refresh y logout normal exigen `X-CSRF-Token`, ligado a familia, canal y `clientInstanceId`;
- logout elimina la cookie con un `Set-Cookie` equivalente, `Max-Age=0`.

Para mobile:

- access y refresh se devuelven en JSON;
- el refresh se almacena en Keychain/Keystore mediante secure storage, nunca en preferencias, SQLite sin cifrar, logs, backups o analítica;
- `/auth/refresh` exige el refresh opaco en el body;
- una cookie se ignora y no puede sustituir el body;
- el access token permanece solo en memoria y se regenera con el refresh.

El logout local es defensivo e independiente de la respuesta remota. WEB borra
access, CSRF y estado de aplicación, marca un `logoutPending` no secreto e
inhabilita cualquier refresh automático antes de enviar la petición. JavaScript
no puede borrar `__Host-fs-refresh` por ser HttpOnly: la cookie solo se elimina
cuando el servidor responde con `Set-Cookie ... Max-Age=0`. Si no hay red, al
recuperarla WEB reintenta exclusivamente la operación de cierre descrita abajo;
el navegador adjunta la cookie pero la operación nunca emite access, refresh,
CSRF ni datos de usuario.

MOBILE detiene rastreo y elimina access/refresh de secure storage antes de
esperar `204`. Conserva únicamente un `sessionRevocationTicket` opaco de 32
bytes, emitido al login para esa familia y persistido solo en secure storage
hasta confirmar la revocación. PostgreSQL conserva solo su HMAC; el ticket es
de un uso, expira con la familia, se invalida al revocar y solo puede revocar
esa familia. No autentica, no permite refresh, no entrega identidad/tenant/rol
ni admite `allSessions=true`; su pérdida puede causar como máximo un logout
idempotente de la propia familia. Un timeout, error de red o respuesta no
exitosa nunca conserva access/refresh ni reanuda rastreo.

El cierre MOBILE pendiente también revoca inmediatamente las vinculaciones de
push de instalación asociadas a esa familia mediante el puerto público de
`notifications` definido en ADR-017. `identityaccess` resuelve el HMAC del
ticket y entrega al puerto solo `sessionFamilyId` y ámbito técnico derivado; no
transmite el ticket, access, refresh, token push, tenant o usuario declarados
por el cliente. El resultado sigue siendo un cierre idempotente de la propia
familia y no habilita una operación de dispositivo autónoma con el ticket.

La entrega de activación/recuperación mediante `IdentityNotificationPort` sigue
ADR-017: trabajo durable cifrado y de acceso mínimo, `expiresAt` no posterior
al token, latest-wins por tenant+cuenta+propósito, reintento sin superar la
expiración y crypto-erase al resolver. La respuesta neutral no depende de
creación, cuota, fallo o entrega del trabajo.

El servidor envía `Cache-Control: no-store` y `Pragma: no-cache` en toda respuesta que contenga o rote credenciales.

### CSRF y CORS

Los endpoints de negocio usan access token explícito en `Authorization` y no autenticación por cookie, por lo que no dependen de CSRF. Web refresh y logout normal usan una credencial ambiental y requieren el token CSRF. La única excepción es el cierre WEB pendiente definido abajo: exige `X-Logout-Intent: PENDING`, `Origin` allowlisted exacto y cookie `SameSite=Strict`, solo puede revocar/borrar y jamás renovar, emitir o leer una credencial. Token CSRF ausente o incorrecto en refresh/logout normal responde `403 CSRF_TOKEN_INVALID` sin consumir el refresh.

CORS usa allowlist exacta por ambiente, `Access-Control-Allow-Credentials: true` únicamente para orígenes aprobados, y nunca combina credenciales con `*`. Solo admite los métodos y headers necesarios, incluidos `Authorization`, `Content-Type`, `X-Auth-Client`, `X-Client-Instance-Id`, `X-CSRF-Token`, `X-Logout-Intent` y `X-Correlation-Id`; expone `X-Correlation-Id`, no `Set-Cookie`. El preflight del cierre WEB pendiente permite `X-Logout-Intent` solo para el Origin exacto aprobado y el método `POST` de `/auth/logout`. Un origen no permitido no recibe headers CORS. El despliegue mismo-host es preferido.

### Login, primer acceso y estado de cuenta

No existe `/register`, registro público, contraseña predeterminada ni credencial compartida. Solo un flujo administrativo autorizado crea una cuenta de empresa `INVITED` y solicita una activación. EN-012 sigue siendo el único mecanismo de bootstrap de plataforma.

Una cuenta invitada no tiene contraseña utilizable. La activación emplea el mismo mecanismo opaco de acción de un solo uso descrito para recuperación, con propósito persistido `ACTIVATION` y expiración de 24 horas. Emitir otra activación invalida la anterior. Al consumirla se establece el hash BCrypt 12, se cambia la cuenta a `ACTIVE` y se invalida el resto de tokens de acción. El token no asigna tenant ni rol: estos ya deben existir en relaciones persistidas creadas por el flujo administrativo.

Login acepta correo o nombre de usuario y contraseña. Identificador desconocido, password incorrecto, cuenta invitada/inactiva/bloqueada o empresa suspendida/inactiva siempre responde `401 AUTHENTICATION_FAILED` con mensaje y tiempo observables equivalentes. No se comunica cuál condición falló.

### Recuperación y cambio de contraseña

`POST /auth/password-recovery-requests` siempre responde `202` con el mismo
cuerpo para entrada sintácticamente válida, exista o no una cuenta utilizable.
Después de validar sintaxis y aplicar el mismo rate limit, el endpoint persiste
o encola una solicitud genérica y responde antes de buscar una cuenta, crear un
token o invocar una notificación. El worker canónico resuelve la identidad y,
solo si es utilizable, crea el token y solicita su entrega; la ausencia o estado
de cuenta no cambia la respuesta, el presupuesto temporal visible ni los
eventos observables por el solicitante. El trabajo de cola/persistencia debe
tener el mismo camino para entradas existentes e inexistentes y, si no puede
aceptarse, responde el mismo `503 AUTH_RATE_LIMIT_UNAVAILABLE` sin consultar la
cuenta. EN-017 elegirá proveedor y canal; EN-013 solo exige que el token no
aparezca en logs, eventos generales ni respuesta HTTP.

El token de recuperación:

- usa el mismo formato opaco aleatorio de 32 bytes;
- se persiste solo como `HMAC-SHA-256`;
- tiene propósito `PASSWORD_RESET`;
- expira exactamente a los 30 minutos;
- es de un solo uso;
- una nueva emisión invalida tokens anteriores del mismo propósito/cuenta;
- su consumo se serializa en PostgreSQL.

`POST /auth/password-resets` acepta tokens de activación o recuperación y valida el propósito almacenado. Un token malformado, desconocido, ya consumido o de propósito incompatible responde `400 PASSWORD_RESET_TOKEN_INVALID`; uno reconocido pero expirado responde `410 PASSWORD_RESET_TOKEN_EXPIRED`. Estas respuestas no enumeran cuentas porque solo se producen al presentar un secreto de alta entropía. Una contraseña fuera de política responde `422 PASSWORD_POLICY_VIOLATION`.

Un reset exitoso consume el token, incrementa la versión de credencial, revoca todas las familias web/mobile de la cuenta, invalida sus caches y los demás tokens de acción dentro de la misma transacción. La activación también invalida tokens de acción, aunque normalmente no haya sesiones previas.

### Logout, bloqueo y revocación

`POST /auth/logout` tiene tres formas mutuamente excluyentes. (1) El cierre
normal usa un access vigente y, para WEB, CSRF: `allSessions=false` revoca la
familia de `sid` y `true` todas las familias de la cuenta y tenant. (2) WEB con
`logoutPending` sin access/CSRF envía `X-Logout-Intent: PENDING` desde un Origin
exactamente allowlisted; el servidor acepta solo su cookie HttpOnly para
revocar esa familia y devolver el `Set-Cookie` de borrado. Esta forma no admite
`allSessions=true`, no rota/renueva la cookie y devuelve siempre `204` sin
credenciales ni identidad. (3) MOBILE pendiente envía
`X-Session-Revocation-Ticket`; el servidor resuelve su HMAC y revoca solo la
familia ligada. Esta forma no admite cookie, access ni `allSessions=true`.
Una familia ya revocada también responde `204`, sin revelar estado. El servidor
nunca devuelve `429` ni omite una revocación por cuota: el control de abuso solo
deduplica, registra y alerta las solicitudes globales excesivas, pero procesa
la revocación idempotente.

Bloqueo/inactivación de usuario, suspensión de empresa, reset de contraseña, reutilización detectada y revocación administrativa invalidan inmediatamente las familias alcanzadas. PostgreSQL decide siempre si una familia está activa: el filtro consulta su fila de familia, cuenta y tenant en cada aceptación de access; Redis solo puede conservar tombstones de familias revocadas para rechazar antes y nunca respuestas positivas `ACTIVE`. La transacción que revoca confirma primero PostgreSQL y después intenta publicar el tombstone; un fallo de Redis se registra y reintenta de forma durable, pero no cambia la decisión del filtro ni permite un hit obsoleto. Por tanto la revocación no espera los 10 minutos de expiración y Redis degradado o stale nunca reactiva una sesión.

### Rate limiting y abuso

Redis contiene contadores efímeros, segregados mediante HMAC de identificadores y sin correo/usuario en claro. Los límites iniciales por ambiente son:

| Operación | Límites acumulativos |
|---|---|
| Login | 5/15 min por identificador canónico independiente de IP; 5/15 min por identificador+IP; 30/15 min por IP |
| Solicitar recuperación/activación | 3/h por identificador; 20/h por IP |
| Consumir token de acción | 5/15 min por digest de token+IP; 30/15 min por IP |
| Refresh | 30/min por familia+IP; para token/familia desconocidos, 30/min por digest presentado+IP y 120/min por IP |
| Logout global | 5/h por cuenta para deduplicación, alerta y backoff interno; nunca niega ni retrasa la revocación |

El identificador canónico se normaliza de forma idéntica para correo y nombre de usuario antes de calcular un HMAC; se aplica también a entradas inexistentes y nunca se guarda ni publica en claro. El límite acumulativo por identificador no bloquea ni cambia el estado de la cuenta: devuelve el mismo `429 AUTH_RATE_LIMITED` y `Retry-After` para existente e inexistente, evitando que un atacante provoque lockout persistente. Los límites no distinguen públicamente cuentas existentes. Login, refresh y operaciones de acción fallan cerradas con `503 AUTH_RATE_LIMIT_UNAVAILABLE` y `Retry-After` si no se puede aplicar el limitador; logout sigue procesándose para no impedir una revocación defensiva. Los umbrales son configuración técnica versionada y solo pueden relajarse mediante revisión de seguridad.

### Persistencia, cache y aislamiento multiempresa

PostgreSQL es la fuente de verdad. La implementación de BE-003 a BE-006 creará mediante una migración nueva, sin modificar V1/V2:

- evolución de `identity_access_account`: estado, versión de credencial, timestamps de password y soporte de hash nulo solo para `INVITED`;
- `identity_access_session_family`: cuenta, `company_id` nullable solo para plataforma, canal, digest de cliente, creación, expiración absoluta, revocación y motivo;
- digest HMAC del `sessionRevocationTicket` de un uso para el cierre pendiente
  MOBILE, sin reutilizar el digest de refresh;
- `identity_access_refresh_token`: familia, digest único, padre/sucesor, emisión, expiración y consumo;
- `identity_access_action_token`: cuenta, `company_id`, propósito, digest único, emisión, expiración, consumo e invalidación.

Las FK, checks e índices parciales deben preservar la correspondencia rol/empresa de V2. Toda consulta por cuenta/familia se restringe por el tenant derivado de la sesión cuando aplica. Los tokens públicos se resuelven por digest de alta entropía y nunca aceptan `tenantId` del cliente.

Redis solo acelera tombstones de sesión y rate limits. Las claves siguen `auth:session:<platform|tenantUuid>:<familyUuid>` para revocación y `auth:rate:<scope>:<hmac>`, con TTL no mayor que el registro PostgreSQL. No se almacenan decisiones positivas de sesión en Redis. Un miss, caída o dato stale de Redis nunca crea autoridad ni reactiva una sesión.

### Auditoría y observabilidad

Se auditan, mediante puerto público hacia `audit` cuando esté disponible: login exitoso/fallido, refresh exitoso/rotado/reutilizado, logout actual/global, solicitud y consumo de acción, cambio de password, bloqueo y revocación.

Los campos permitidos son `correlationId`, operación, resultado, UUID técnico de cuenta/familia cuando ya se conoce, tenant técnico cuando aplica, canal, timestamp, latencia y categoría de error. IP y user-agent se minimizan o pseudonimizan según política operativa. Nunca se registran identificador de login completo, contraseña, JWT, refresh, token de acción, cookie, `Authorization`, CSRF, digest criptográfico ni payload completo.

Las métricas agregadas no contienen tenant o identidad como labels de alta cardinalidad. Alertas mínimas: picos de fallo de login, reutilización de refresh, recuperación, rate limiting y fallos de invalidación de cache.

### Política de errores HTTP

Todos los errores usan `application/problem+json`, `correlationId`, `Cache-Control: no-store` y detalle no sensible. Los consumidores pueden actuar por `status` y `code`, nunca por texto:

| Flujo | Estado/códigos relevantes |
|---|---|
| Access | `401 ACCESS_TOKEN_EXPIRED`, `ACCESS_TOKEN_INVALID`, `SESSION_REVOKED` |
| Login | `401 AUTHENTICATION_FAILED` neutral |
| Canal | `400 AUTH_CLIENT_CHANNEL_INVALID` |
| CSRF | `403 CSRF_TOKEN_INVALID` |
| Refresh | códigos definidos en la tabla de rotación |
| Reset | `400 PASSWORD_RESET_TOKEN_INVALID`, `410 PASSWORD_RESET_TOKEN_EXPIRED`, `422 PASSWORD_POLICY_VIOLATION` |
| Abuso/degradación | `429 AUTH_RATE_LIMITED`, `503 AUTH_RATE_LIMIT_UNAVAILABLE` |

### Despliegue, migración y rollback

La implementación posterior se despliega en transición:

1. Generar secretos/claves de firma y HMAC fuera del repositorio y publicar la clave pública; validar fail-fast sin exponer valores.
2. Aplicar la nueva migración forward-only, backfill de la cuenta EN-012 como `ACTIVE` y conservar compatibilidad con V1/V2.
3. Desplegar lectura dual del estado de sesión con endpoints aún cerrados por feature flag; verificar índices, cache y métricas.
4. Habilitar login/refresh/logout/reset por ambiente y origen allowlisted; clientes web/mobile deben confirmar el contrato de canal antes de producción.
5. Retirar cualquier compatibilidad temporal solo después de que no existan consumidores antiguos.

Antes de migrar, rollback es retirar configuración y artefactos. Después de aplicar una migración no se edita ni elimina: se deshabilitan endpoints/flags, se revocan familias emitidas y se crea una migración forward de compensación solo tras comprobar que ningún consumidor depende de las tablas/columnas. Una clave de firma comprometida se retira por `kid`, se revocan todas las familias y se fuerza reautenticación. El rollback nunca restaura tokens revocados ni reexpone refresh tokens web en JSON.

## Alternativas consideradas

- **JWT de larga duración sin estado:** rechazada; impide revocación inmediata y amplía el impacto de robo.
- **Refresh JWT:** rechazado; un token opaco con digest persistido reduce exposición y permite rotación/reutilización explícitas.
- **Refresh en `localStorage` web:** rechazado por exposición a JavaScript/XSS.
- **Refresh web y mobile siempre en body:** rechazado porque permitiría downgrade del secreto HttpOnly.
- **Seleccionar canal solo por header:** rechazado; `Origin`, metadata de navegador y canal persistido también se validan.
- **Sesión solo en Redis:** rechazada; Redis no es fuente de verdad.
- **Contraseña temporal o registro público:** rechazado por el contrato.
- **Proveedor de correo/SMS en este ADR:** pospuesto a EN-017.

## Consecuencias

- Web y mobile comparten semántica de sesión sin compartir almacenamiento inseguro.
- La renovación exige escritura PostgreSQL y coordinación transaccional.
- La revocación inmediata añade una consulta PostgreSQL de estado por solicitud; Redis solo acelera rechazos de familias revocadas.
- Un cliente que pierde la respuesta ganadora de una rotación concurrente debe autenticarse otra vez; nunca se reexpone el sucesor.
- BE-003 a BE-006 deben implementar exactamente este contrato o proponer un nuevo ADR y transición compatible.

## Riesgos residuales

- XSS puede robar el access token y ejecutar acciones mientras siga vigente; CSP, encoding y controles frontend siguen siendo obligatorios.
- Un dispositivo móvil comprometido puede extraer secretos pese a secure storage; la revocación y detección de reutilización limitan el impacto.
- La ventana de concurrencia de 5 segundos reduce falsos positivos, pero debe someterse a pruebas de carrera y abuso.
- Gestión productiva de claves, TLS, WAF y retención de auditoría requieren controles operativos fuera de EN-013.
- La consumibilidad y seguridad deben ser revisadas de forma independiente por Frontend, Mobile, QA y Ciberseguridad antes de implementar BE-003 a BE-006.
