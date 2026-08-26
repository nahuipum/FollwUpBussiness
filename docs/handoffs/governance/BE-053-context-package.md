# BE-053 — Paquete de contexto

## Estado y alcance

- Fase actual: DoF `PASS`.
- Candidate-ID: `30e0ec3+E1BE1E7C5ACACE6A` (árbol sin commit; digest corto del diff BE-053 tras la remediación de Seguridad).
- Alcance: `notifications` consume `route.published`, `route.assigned`, `route.modified` y `route.reassigned` v1, revalida por puertos públicos, reserva/entrega push genérico de forma idempotente y segura, y registra reintento/DLQ/alerta. No crea ni modifica rutas, registro/revocación de dispositivos, Mobile, endpoint público, proveedor externo, SDK, credencial ni infraestructura.
- El contrato y ADR son consistentes: `routing` es único productor/outbox; `notifications` es consumidor. El `routing` actual no expone aún el puerto público de revalidación requerido: crear una superficie pública mínima y versionada, sin consultar su persistencia desde `notifications`.
- No hay proveedor/adaptador push configurado. No escoger FCM/APNs/Firebase ni añadir dependencias o credenciales. Puede introducirse el puerto `RoutePushGateway`, configuración segura y doubles de prueba; cualquier adaptación externa exige consulta al responsable.

## Decisión del responsable — 2026-08-25

- Se aprueba **Firebase Cloud Messaging (FCM)** como proveedor MVP, a través del SDK oficial Firebase Admin Java detrás de `RoutePushGateway`. FCM unifica Android e iOS; no cambia la autoridad de Backend ni el contrato Mobile.
- Las credenciales se obtienen exclusivamente mediante Application Default Credentials/configuración de secretos del ambiente; no se versionan archivos de cuenta, tokens ni variables con secretos. Si el adaptador se habilita sin credenciales válidas debe fallar al arranque o quedar explícitamente deshabilitado, nunca simular una entrega.
- Política de push aprobada: máximo 8 intentos; backoff exponencial desde 1 s hasta 5 min, jitter positivo de hasta 25 %, sin programar nunca después del TTL de 24 h. Transitorios/cuota/timeout van a retry; inválido/no registrado revoca el binding; errores permanentes, vencimiento o agotamiento pasan a DLQ/alerta con diagnóstico saneado. No hay fallback email/SMS.
- Esta decisión exige ADR sucesor de ADR-017, configuración externa/documentada y revisión independiente de QA y Seguridad. El alcance Mobile FCM queda para MOB-029.

## Invariantes obligatorios

- Éxito: solo destinatario técnico de la ruta, del mismo tenant, con instalación/familia activa y no revocada, puede reservar y recibir solicitud push.
- Denegación: producer/tipo/schema/versión/fecha inválidos, tenant/ruta/versión/destinatario no autorizados o instalación revocada/ajena: sin envío, sin filtrar existencia.
- Dedupe: clave atómica `tenantId + eventId + recipientTechnicalId + notificationType`; redelivery, retry y concurrencia no duplican entrega.
- Fallo: push/dependencia/cuota no revierte ruta; transitorios usan backoff+jitter acotado, agotados van a DLQ/alerta, sin email/SMS. TTL: 24 h desde `occurredAt`.
- Privacidad/revocación: título/cuerpo bloqueado estrictamente genéricos; nunca token, payload, ruta, cliente, dirección, fecha, vendedor, PII o coordenadas en logs/métricas/auditoría/errores. Logout, cambio tenant/usuario, suspensión o revocación deja instalación inelegible; token inválido revoca su binding.

## Contratos y decisiones ubicados

- Historia: `docs/stories/backend/BE-053-notificar-ruta-publicada-o-modificada.md`.
- Evento: `docs/events/notification-contract.md`, `docs/events/event-catalog.yaml`; envelope `route-notification/v1`, `notifySeller` ausente equivale a `true`; `false` solo suprime push y conserva validaciones/sincronización.
- Decisión: `docs/architecture/adr/ADR-017-canales-notificacion.md`; `RoutePushGateway` intercambiable por ambiente, detalles externos fuera de dominio; no hay fallback y Mobile refresca desde Backend.
- Dependencias: `BE-024` produce `route.published` en outbox; `BE-055` outbox RabbitMQ; `BE-056` reintento/DLQ. Reutilizar sus semánticas, no modificar tablas/repositorios ajenos.
- Superficie existente: `notifications` solo tiene revocación de instalaciones (`V11`, `JdbcInstallationRevocationAdapter`); `routing` expone publicación/reasignación pero no puerto de lectura/autorización para consumidor. `application.yaml` no tiene configuración de push.

## Desarrollo esperado y evidencia

- Respetar hexagonal: consumidor RabbitMQ de entrada; aplicación/puertos explícitos; persistencia propia con migración nueva para dedupe/estado de entrega; puerto público de `routing` para revalidar. No acceder a repositorios/tablas internos de `routing`, `identityaccess` o Mobile.
- Validar producer `routing`, tipo registrado, `schemaVersion`, versión, `occurredAt` (incluido máximo adelanto), TTL, tenant, ruta, versión, destinatario e instalación antes de reservar. `notifySeller=false` no envía push.
- Antes de invocar gateway, reservar estado/dedupe atómicamente; revalidar instalación/familia/usuario/tenant. Invalidación de token revoca de inmediato. Observabilidad permitida: tipo, resultado, intento, `adapterId`, latencia, `correlationId`, sin etiquetas de tenant/usuario.
- Cubrir caso de uso/dominio, consumer, todas las variantes `route.*`, dedupe/concurrencia, `notifySeller=false`, BOLA multiempresa, instalación revocada/ajena/antigua, token inválido, TTL, fallo/retry/DLQ y contenido genérico, con doubles. Ejecutar `HexagonalArchitectureTest`, `ModuleBoundaryTest`, focalizadas y `mvn clean verify` por mensajería, persistencia, transacciones y composición.
- Development escribe `docs/handoffs/backend/BE-053-development-handoff.md` (máx. 300 palabras, español), calcula una vez Candidate-ID y actualiza este paquete con delta y estado `READY_FOR_HANDOFF` o `BLOCKED`. Sin commits/push/PR ni Graphify.

## Delta Development

- Se añadió el puerto público y de solo lectura `RouteNotificationAuthorizationUseCase` en `routing`, sin acceso de `notifications` a tablas ajenas; el envelope RabbitMQ incorpora `schemaVersion` para `route.*`.
- Se añadieron puertos, consumidor, listener, dedupe persistente e instalación revocable en `notifications`, con migración `V47` y contenido de pantalla bloqueada genérico. Consulta primaria excepcional: `docs/events/notification-contract.md`, secciones envelope/dispositivo, por la contradicción entre el envelope existente y `schemaVersion` y por columnas de instalación inexistentes.
- Bloqueo: falta el adaptador/configuración aprobada de `RoutePushGateway` y la política concreta de reintento con backoff+jitter. Activar el doble actual provocaría fallos transitorios, no una entrega real; no se puede inventar proveedor, credencial ni semántica operativa. Pruebas focalizadas y `mvn -q clean verify` pasan, pero el criterio de entrega/reintento/DLQ no queda demostrable.

## Delta QA

- `CHANGES_REQUIRED` para `30e0ec3+4C6EF96733508A93`: una reserva `RESERVED` bloquea cada redelivery después de un fallo transitorio, anulando el reintento y el agotamiento/DLQ; además, el delay puede cruzar el TTL de 24 h. Remediar solo esos recorridos y añadir pruebas de ambos antes de revalidar QA. No iniciar Seguridad ni DoF.

## Delta de remediación y QA

- Development corrigió el reclamo atómico de `RETRYABLE` y el control de TTL; Candidate-ID nuevo `30e0ec3+AEF6296F9429C056`. La focalizada de servicio/listener y `git diff --check` pasaron; composición sin cambios, se reutiliza `clean verify`.
- QA revalida reclamo/reintento: `PASS`. Devuelve `CHANGES_REQUIRED` por borde alto aún abierto: igualdad exacta con `occurredAt + 24 h` se programa por `!isAfter`, aunque debe ir a DLQ. Cierre observable: usar comparación estricta, añadir prueba de igualdad que confirme DLQ y ausencia de envío/programación, y revalidar QA. Se alcanzó el máximo de una corrección Development→QA; no iniciar Seguridad ni DoF.
- Remediación: FCM/Firebase Admin queda detrás de `RoutePushGateway`; ADC es obligatorio al habilitar `NOTIFICATIONS_FCM_ENABLED`, y deshabilitado explícito no confirma entrega. Se añadió retry Rabbit con 8 intentos, 1 s--5 min y jitter <=25 %, y ADR-024. Validación final aislada por orquestación: `mvn -q '-Dmaven.repo.local=.be053-m2' clean verify` PASS; `git diff --check` PASS.

## Delta QA final

- Candidate-ID `30e0ec3+EACFA84D3E205A79`: `PASS`. El TTL usa comparación estricta y la igualdad determinista con jitter cero va a DLQ sin retry ni entrega; el reclamo `RETRYABLE` sigue atómico y deduplicado. Focalizada y `git diff --check` PASS; `clean verify` reutilizado porque no cambió composición. Procede Seguridad obligatoria.

## Delta Development — remediación

- La reserva atómica reclama únicamente entregas `RETRYABLE`; un fallo transitorio cambia `RESERVED` a `RETRYABLE` antes del redelivery, mientras `DELIVERED` sigue bloqueando duplicados.
- El listener deriva `occurredAt` y envía a DLQ, sin publicar retry, cuando el delay calculado alcanzaría o sobrepasaría TTL de 24 h. Se reprodujeron ocho fallos transitorios (siete retries y DLQ final) y el borde de TTL.
- Validación: `mvn -q '-Dtest=ConsumeRouteNotificationServiceTest,RouteNotificationListenerTest' test` PASS; se reutiliza `mvn -q '-Dmaven.repo.local=.be053-m2' clean verify` PASS porque la remediación no cambia composición; `git diff --check` PASS.

## Delta Development — borde TTL

- `now + delay` debe ser estrictamente anterior a `occurredAt + 24 h`; igualdad y posterior se enrutan a DLQ sin publicar ni programar retry. El jitter se inyecta internamente para una reproducción determinista, sin alterar contrato ni configuración.
- Validación: `mvn -q '-Dtest=RouteNotificationListenerTest' test` PASS y `git diff --check` PASS. No cambia composición, contrato ni FCM; se reutiliza `clean verify` previo.

## Delta Seguridad

- `CHANGES_REQUIRED` para `30e0ec3+EACFA84D3E205A79`. La DLQ republica el mensaje completo con identificadores/fecha en vez de diagnóstico saneado; además, no se valida productor `routing` y no existe alerta observable para fallo permanente, vencimiento o agotamiento.
- Reproducción focalizada PASS: el caso TTL confirma que se envía a DLQ el mismo `Message` con el cuerpo original. Cierre: envelope DLQ saneado, productor obligatorio antes de efectos y métrica/alerta sin datos sensibles, con pruebas negativas. Reporte: `docs/handoffs/security/BE-053-security-report.md`.

## Delta Development — remediación Seguridad

- Candidate-ID: `30e0ec3+E1BE1E7C5ACACE6A`. La DLQ publica un `route-notification-dlq/v1` nuevo con solo `outcome` técnico y `attempt`; no reutiliza cuerpo ni cabeceras del mensaje original. La métrica `notifications.route.delivery.failures` solo etiqueta `outcome`.
- El transporte outbox agrega `producer: routing` a los eventos `route.*`; el listener exige productor y schema antes de consultar, reservar, enviar o publicar. Productor ausente/incorrecto se descarta sin efectos de broker ni consumidor.
- Validación: `mvn -q '-Dmaven.repo.local=.be053-m2' '-Dtest=RouteNotificationListenerTest,RabbitMqEventTransportTest' test` PASS, `mvn -q '-Dmaven.repo.local=.be053-m2' clean verify` PASS y `git diff --check` PASS. Procede QA de remediación y, si pasa, revalidación de Seguridad.

## Delta QA — remediación Seguridad

- `PASS` para `30e0ec3+E1BE1E7C5ACACE6A`: la DLQ genera un envelope nuevo sin `Message`, cabeceras, tenant, ruta, destinatario ni fecha; productor distinto de `routing` no produce efectos; la métrica solo etiqueta `outcome`.
- Regresión directa: ocho fallos transitorios (siete retries y DLQ final), TTL posterior e igualdad exacta envían a DLQ sin retry. `mvn -q '-Dmaven.repo.local=.be053-m2' '-Dtest=RouteNotificationListenerTest,RabbitMqEventTransportTest' test` PASS y `git diff --check` PASS; se reutiliza `clean verify` PASS del mismo candidato. Procede revalidación de Seguridad.

## Delta Seguridad — revalidación final

- `PASS` para `30e0ec3+E1BE1E7C5ACACE6A`. Cerrados `SEC-BE053-01/02/03`: la DLQ usa mensaje y propiedades nuevos con solo `outcome`/`attempt`; productor incorrecto queda sin efectos; el productor outbox declara `routing`; la métrica solo etiqueta el resultado técnico.
- Reproducción focalizada `RouteNotificationListenerTest,RabbitMqEventTransportTest` PASS. Se reutilizan QA y `clean verify` PASS del mismo candidato. RabbitMQ/FCM/ADC reales permanecen `NOT_EXECUTED`; procede DoF.

## Delta DoF

- `PASS` para `30e0ec3+E1BE1E7C5ACACE6A`: Development `READY_FOR_HANDOFF`, QA `PASS` y Seguridad `PASS` son trazables al mismo candidato; no hay hallazgos abiertos. La evidencia declarada incluye focalizadas y `clean verify` PASS. `git diff --check` finaliza con código 0 (solo advertencias LF/CRLF).
