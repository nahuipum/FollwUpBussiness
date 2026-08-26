# BE-053 — Development handoff

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `30e0ec3+E1BE1E7C5ACACE6A`

Remediación exclusiva de Seguridad. [`RouteNotificationListener`](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/notifications/adapter/in/messaging/RouteNotificationListener.java) descarta productor ausente/incorrecto antes de todo efecto y publica a DLQ un envelope nuevo `route-notification-dlq/v1`, con únicamente `outcome` técnico y `attempt`; no conserva cuerpo, headers, tenant, ruta, destinatario ni fecha. Registra el contador seguro `notifications.route.delivery.failures` con la única etiqueta `outcome` para fallos permanentes, vencimiento y agotamiento.

[`RabbitMqEventTransport`](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/outbox/adapter/out/messaging/RabbitMqEventTransport.java) emite `producer: routing` en los eventos `route.*`. [`NotificationsConfiguration`](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/notifications/config/NotificationsConfiguration.java) inyecta `MeterRegistry`. No cambian FCM, credenciales, reglas de negocio, migraciones ni infraestructura.

Pruebas añadidas/actualizadas: DLQ saneada para vencimiento y agotamiento, ausencia de productor sin efectos, métrica sin etiquetas sensibles y emisión del productor. `mvn -q '-Dmaven.repo.local=.be053-m2' '-Dtest=RouteNotificationListenerTest,RabbitMqEventTransportTest' test` PASS; `mvn -q '-Dmaven.repo.local=.be053-m2' clean verify` PASS; `git diff --check` PASS.

Riesgo residual: RabbitMQ/FCM reales no se ejecutan localmente. Reproducir con la prueba focalizada anterior. Sin commit/push/PR.
