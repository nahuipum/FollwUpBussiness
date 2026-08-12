# Seguridad — BE-063 / FE-043

Estado: `PASS`  
Candidate-ID: `71a31cc + 68a518fe`.

## Superficie revisada

Autorización, aislamiento tenant, token de invitación, datos personales, notificación durable, auditoría/outbox, atomicidad y limpieza de estado frontend.

## Controles y evidencia

- `PASS`: `CompanyUserService` exige `COMPANY_ADMIN`; actor y tenant proceden sólo de sesión y las consultas filtran por `company_id`. El conjunto cerrado de roles impide `PLATFORM_SUPERADMIN`.
- `PASS`: reemplazar la invitación invalida el token anterior y el consumo excluye tokens invalidados. La notificación cifra correo/token; API, auditoría y outbox exponen sólo campos técnicos, sin token, enlace ni credenciales.
- `PASS`: el wrapper transaccional agrupa cuenta, token, notificación, auditoría y outbox; la entrega durable ocurre después del commit.
- `PASS`: FE limpia diálogo, selección, errores y resultado al cerrar sesión o cambiar empresa, y no expone secretos.
- Evidencia reutilizada del mismo candidato: QA Backend focalizado/integración `PASS`; QA Frontend 10 pruebas y type-check `PASS`.

## Hallazgos y abuso

Hallazgos: ninguno. Abuso cubierto: supervisor, rol de plataforma o `userId` de otro tenant no puede reenviar ni producir escrituras; token sustituido no puede consumirse. La reproducción quedó `NOT_EXECUTED` en esta revalidación porque el único cambio fue de metadatos, sin cambio de código, superficie, amenaza o control; se reutilizó la evidencia del mismo candidato.

No aplican WebSocket, almacenamiento local persistente, caché/Redis, archivos, pagos ni infraestructura. Riesgo residual: `mvn -q clean verify` completo depende de Testcontainers; las pruebas focalizadas e integración aplicables permanecen `PASS`.
