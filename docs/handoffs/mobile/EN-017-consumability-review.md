# Revisión de consumibilidad Mobile — EN-017

## Estado

`PASS` — la remediación de Fase 2 resuelve los tres bloqueantes de
consumibilidad Mobile. Esta revisión no aprueba ADR-017 ni modifica código,
contratos o decisiones.

## Alcance revisado

- Historia `docs/stories/enablers/EN-017-definir-canales-de-notificacion.md` y
  consecuente `docs/stories/mobile/MOB-029-recibir-ruta-asignada-o-modificada.md`.
- Handoff actualizado, ADR-017, `notification-contract.md`, ADR-008,
  `event-catalog.yaml`, ADR-015 y `mobile-sync-contract.md`.
- REST afectado: `/devices`, `/devices/{deviceId}`, `POST /auth/logout`,
  `/routes/my-route`, `/routes/{routeId}` y `/mobile/bootstrap`.
- Flutter actual sigue siendo un scaffold sin push, secure storage,
  persistencia/cola de rutas ni receptor implementados.

## Revalidación de Fase 2

| Bloqueante previo | Evidencia actual | Resultado |
|---|---|---|
| Cuerpo y plataforma de registro incompatibles | ADR-017 y `notification-contract.md` establecen que `notification-device/v1` se representa exclusivamente por `POST /devices` / `RegisterDeviceRequest`: `installationId`, `platform: ANDROID|IOS`, `pushToken`, `appVersion` obligatorio y `deviceModel` opcional. `schemaVersion` no viaja en JSON por `additionalProperties: false`. | PASS: Flutter tiene una serialización canónica, sin campos prohibidos; tenant/usuario siguen derivados de sesión. |
| Revocación repetida devolvía `404` | `DELETE /devices/{deviceId}` declara `204`, neutral e idempotente para propia, ajena, revocada o inexistente; resuelve tenant+usuario+deviceId y mantiene tiempo indistinguible. Autenticación/rol se validan antes, sin `403` por pertenencia. | PASS: logout/reintento no revela existencia ni convierte una baja previa en fallo. |
| Logout con ticket no revocaba instalación | ADR-008, ADR-017, contrato y OpenAPI de `POST /auth/logout` definen que `identityaccess` resuelve el HMAC del ticket y llama internamente a `RevokeInstallationsForSession(sessionFamilyId, tenantScope)`. El puerto recibe solo IDs técnicos derivados; ticket, access, refresh y push token no lo cruzan, persisten ni registran. | PASS: tras detener tracking y borrar access/refresh, Mobile reintenta exclusivamente logout pendiente; las instalaciones ligadas se revocan antes del `204`, sin llamada autenticada inventada a `/devices`. |

El ticket se mantiene opaco, de un uso y limitado a su propia familia: no
autentica un endpoint de dispositivo ni reanuda sesión. La revocación conserva
la segregación por ámbito derivado y no expone secretos.

## Compatibilidad de MOB-029

- Registro/revocación exige `SELLER`; Mobile no declara identidad, tenant ni
  usuario.
- Tokens de push, refresh y ticket permanecen en Keychain/Keystore; no se
  devuelven ni se registran en logs, métricas o analítica.
- Título/cuerpo en pantalla bloqueada son genéricos, sin ruta, cliente,
  dirección, identificador o contenido de identidad.
- Dedupe backend: `tenantId + eventId + recipientTechnicalId + notificationType`; TTL
  push: 24 h desde `occurredAt`. Mobile no trata el push como confirmación ni
  reconstruye estado desde duplicados/vencidos.
- Push solo dispara refresh autorizado al abrir/reconectar, mediante bootstrap
  o consulta de ruta; la respuesta backend es la fuente de verdad. Se conservan
  `tenantId + ownerUserId`, datos originales y la cola offline de ADR-015.
- La notificación no habilita tracking; este permanece limitado a jornada
  activa y se detiene en logout.

## Flujo online/offline verificable al implementar

1. Con permiso `SELLER`, registrar o rotar la misma `installationId` con token
   de push y `Idempotency-Key` estable por comando; guardar secretos solo en
   secure storage.
2. Ante push genérica duplicada o vencida, no modificar la ruta local ni
   revelar contenido; al abrir/reconectar, refrescar desde Backend y aplicar
   únicamente la respuesta autorizada/versionada.
3. Sin red, detener tracking y borrar access/refresh; conservar solo el ticket
   en secure storage. Al reconectar, repetir `POST /auth/logout`; el backend
   revoca familia e instalaciones vinculadas antes de `204`.
4. Repetir logout, rotación o revocación y verificar que no se reelige una
   instalación ni se cruza tenant/usuario.

## Verificación

- Contraste del handoff Fase 2 con ADR-017, `notification-contract.md`,
  ADR-008 y OpenAPI afectado.
- `git diff --check` — PASS.
- No se repitieron `flutter analyze` ni pruebas Flutter: no hay código MOB-029
  y la remediación solicitada es documental.

## Riesgos de implementación

Persisten disponibilidad de push, token obsoleto, entrega al menos una vez y
cuota/proveedor degradado. MOB-029 debe cubrirlos con pruebas de dispositivo de
permiso push, rotación, duplicados, TTL, logout offline, aislamiento por
tenant/usuario y refresh autoritativo. No queda bloqueo documental de
consumibilidad Mobile para iniciar la historia cuando sus dependencias
implementadoras estén disponibles.
