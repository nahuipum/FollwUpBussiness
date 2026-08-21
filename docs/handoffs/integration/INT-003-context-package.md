# INT-003 — Paquete de contexto

## Estado

`PASS` — Desarrollo, QA, Seguridad y DoF completados sobre Candidate-ID
vigente: `78c1534 + INT-003-MOB:4adaa21cc689`.

## Alcance previsto

Validación E2E Flutter + API + secure storage: login `SELLER` activo por
cliente `MOBILE`, renovación, logout/revocación y segregación local por tenant.
No incluye alta de usuarios, roles, recuperación de contraseña ni autenticación
web.

## Gate de predecesoras

| Predecesora | Evidencia localizada | Estado |
| --- | --- | --- |
| BE-003 | DoF `PASS` | Cumple |
| BE-004 | DoF `PASS` | Cumple |
| BE-005 | DoF v20 `PASS` | Cumple |
| MOB-001 | DoF `PASS` | Cumple |
| MOB-002 | DoF `PASS` | Cumple |
| MOB-027 | DoF `PASS` | Cumple |
| INT-004 | Desarrollo Backend/Mobile `READY_FOR_HANDOFF`, QA, Seguridad y DoF `PASS`; Candidate-ID `d2f2a26 + INT-004:c584aaebb2c3` | Cumple |

## Hallazgo

`INT-004-DEP-01` (Alta, integración/contrato) queda **cerrado**: se localizaron
los artefactos canónicos de Desarrollo, QA, Seguridad y DoF `PASS`. El contrato
verificado exige vendedor y empresa `ACTIVE`, rol `SELLER`, tenant derivado por
Backend y cliente `MOBILE`; la inactivación revoca sesiones y tokens de acción.

## Decisión

### Fase 0 — Mobile QA de solo lectura

Validar contra backend local `:8080`, usando únicamente las credenciales
`ACCOUNT_MOBILE_SELLER` y `PASSWORD_MOBILE_SELLER` de `.env` raíz sin
exponerlas: login, renovación, logout, reinicio, cambio de usuario/tenant,
refresh expirado/revocado y conectividad intermitente. Confirmar access token
solo en memoria, refresh únicamente en secure storage y ausencia de registros
sensibles. Si se halla un defecto, devolver ID, severidad, aplicación,
evidencia, criterio y remediación mínima; no modificar nada. Si es compatible,
registrar `READY_FOR_HANDOFF` en este paquete.

No se creó Candidate-ID porque no hubo modificación de implementación.

### Hallazgo de Fase 0

`INT-003-MOB-QA-01` — **Alta**, `mobile`/integración. En backend local,
`login → refresh → logout → refresh` respondió `200 → 200 → 400 → 200`.
`AuthSessionRemote` envía `{}` a `POST /auth/logout`, pero el contrato actual
acepta `{"allSessions":false}` y entonces responde `204`; el refresh posterior
recibe `401`. El ticket offline se conservaría, pero reintentándolo con `{}` no
revocaría la familia. Afecta logout/revocación, limpieza y la prohibición de
recuperar sesión revocada. Remediación mínima autorizada: enviar
`allSessions: false` desde móvil y probar `204` seguido de refresh rechazado.
No se detectó defecto de Backend o contrato.

### QA independiente

La remediación local pasó: cuerpo `allSessions:false`, logout `204` y refresh
previo rechazado `401`; `flutter test` focalizado y `flutter analyze` pasaron.
La primera comprobación reportó `WebException`; se revalidó localmente y el
servidor responde en `localhost`, `127.0.0.1` e `::1` (401 para health protegido
y 405 para GET de `/auth/login`). `INT-003-QA-ENV-01` queda **cerrado**; repetir
la secuencia E2E real con la cuenta configurada. El Candidate-ID y
`git diff --check` coinciden con el handoff QA.

### QA revalidada

`PASS` sobre el Candidate-ID vigente. Contra `127.0.0.1:8080`, sin exponer
secretos: login `MOBILE` de `SELLER` activo devolvió `200` con identidad, tenant
y rol coherentes; refresh `200`; logout `204`; el refresh rotado posterior
devolvió `401`. La prueba focalizada conserva access solo en memoria, refresh y
ticket segregados en secure storage, y no introduce logs sensibles. El handoff
QA sustituye el bloqueo ambiental ya cerrado.

### Seguridad final

`PASS` sobre el mismo Candidate-ID. Abuso decisivo reproducido: login `200` →
refresh `200` → logout `204` con `allSessions:false` → reutilización del refresh
rotado `401/REFRESH_TOKEN_INVALID`. No hay hallazgos Critical ni High abiertos;
los controles de memoria/secure storage, limpieza por ámbito y `correlationId`
se mantienen. DoF puede iniciar.

### Definition of Finished

`PASS`: los cuatro artefactos declaran la misma candidatura; no quedan
hallazgos Critical/High y `git diff --check` pasó. No se realizaron commits,
push ni PR.
