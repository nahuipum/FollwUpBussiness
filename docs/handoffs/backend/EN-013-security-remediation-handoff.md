# Remediación Backend — EN-013 Seguridad

## Estado

READY_FOR_HANDOFF

Remediación documental y contractual de los hallazgos `SEC-EN013-001..005` de
`docs/handoffs/security/EN-013-security-review.md`. No constituye el retest de
Seguridad ni habilita BE-003 a BE-006.

## Snapshot y alcance

- Base revisada por Seguridad: `adec7be3ec673ff9681a517a1d11f10ed0781c28`.
- HEAD de remediación: `50c02f89e5907a10b2ec78f0a41a9a392db8595f`.
- Base funcional original: `4987f5eef7c9310b5a8ed4aa2c08f96d71b6de24`;
  predecesora: `5233521136e763f05a285cff2b57e1d7ee7974c5`.
- Este candidato es el worktree sobre `adec7be`; no hay commit nuevo.
- Cambios propios de esta remediación: ADR-008, OpenAPI, prueba de contrato y
  este handoff. Se preservan los handoffs QA/Seguridad concurrentes sin
  modificarlos.

## Hallazgos resueltos

| Hallazgo | Remediación verificable |
|---|---|
| `SEC-EN013-001` High, fuerza bruta distribuida | Login limita `5/15 min` por identificador canónico HMAC independiente de IP, además de los límites identidad+IP e IP; se aplica a entradas inexistentes y no bloquea estado de cuenta. Refresh desconocido queda limitado por digest presentado+IP e IP. |
| `SEC-EN013-002` Medium, Redis stale | PostgreSQL decide cada aceptación de access sobre familia, cuenta y tenant. Redis solo almacena tombstones para rechazos, nunca `ACTIVE`; una falla al publicar tombstone se reintenta sin afectar la decisión autoritativa. |
| `SEC-EN013-003` Medium, timing recovery | La respuesta `202` acepta una solicitud genérica antes de resolver cuenta/token/notificación. El procesamiento interno usa el mismo camino para existentes e inexistentes; no selecciona proveedor ni canal EN-017. |
| `SEC-EN013-004` Medium, logout defensivo | WEB borra estado JS y bloquea refresh, pero solo el servidor borra la cookie HttpOnly; el reintento pendiente usa cookie + `X-Logout-Intent: PENDING` y no emite credenciales. MOBILE elimina access/refresh y conserva solo un ticket opaco de revocación, de un uso y sin capacidad de sesión. |
| `SEC-EN013-005` Low, error 422 | `/auth/password-resets` referencia `PasswordPolicyViolation` con `x-error-codes: [PASSWORD_POLICY_VIOLATION]`. |

## Archivos y contratos

- `docs/architecture/adr/ADR-008-autenticacion-sesiones.md`: sin cambiar su
  estado `Propuesto`; actualiza semántica de revocación, abuso, recovery y
  logout.
- `docs/api/openapi.yaml`: ajusta `/auth/logout`, recovery y reset; declara
  `X-Logout-Intent` y `X-Session-Revocation-Ticket` para cierre pendiente sin
  reexponer refresh, y permite `X-Logout-Intent` en preflight CORS solo para
  el Origin exacto aprobado y `POST /auth/logout`. No modifica EN-017 ni
  introduce endpoints implementados.
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/AuthenticationContractPolicyTest.java`:
  pasa de cinco a siete pruebas y protege los cinco controles, incluido el
  cierre offline WEB/MOBILE implementable.
- No hay migración ni código productivo. BE-003..006 deberán crear migraciones
  forward-only para la política y demostrar carreras DB↔Redis, rate limiting y
  aceptación genérica de recovery.

## Verificación reproducible

Ejecutado con JDK 21.0.9:

| Comando | Resultado |
|---|---|
| `mvn "-Dtest=AuthenticationContractPolicyTest" test` desde `backend/followupbussiness` | PASS: 7 pruebas, 0 fallos, 0 errores, 0 omitidas. |
| `npx --yes @redocly/cli lint docs/api/openapi.yaml` | PASS: contrato válido. |
| `git diff --check` | PASS: sin errores de whitespace. |

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
Set-Location backend\followupbussiness
mvn "-Dtest=AuthenticationContractPolicyTest" test
Set-Location ..\..
npx --yes @redocly/cli lint docs/api/openapi.yaml
git diff --check
```

## Riesgos y retest requerido

- No hay runtime: Seguridad debe retestar el diff actual y no reutilizar su
  `BLOCKED` anterior como aprobación.
- BE-003..006 deben probar la carrera commit PostgreSQL/fallo Redis/tombstone,
  rate limiting de identidad distribuida y token refresh desconocido.
- BE-006 debe probar recuperación existente/inexistente con medición de timing
  en red controlada; BE-005/FE-003/MOB-002 deben probar timeout, reinicio,
  cookie HttpOnly persistente, ticket de revocación, reintento y extracción de
  almacenamiento sin emitir ni restaurar sesión.
- XSS, dispositivo comprometido, TLS/WAF, proxy de IP confiable y proveedor de
  notificaciones siguen siendo riesgos u operaciones posteriores. EN-017 no
  fue iniciado ni modificado.

## Huellas

- ADR-008: `C10B2F4F50CC1535E4BDAC4A969ADA82E722F9DBDDD0A7C664410F7CDD392B58`.
- OpenAPI: `AB1265F81658F3B4FEAC6C810CF2025AD29AD5A4D18965A5D3B35DF9DE911D46`.
- Prueba contractual: `3CC845BA95255CD6A6EE944AC707E0B9E6092072B567C85D43B846CF3D2BECB3`.

QA y Seguridad deben recalcular las tres huellas y revisar `git status --short`
antes de retestar; los handoffs QA/Seguridad no rastreados son aportes ajenos y
no se atribuyen a esta remediación.

READY_FOR_HANDOFF
