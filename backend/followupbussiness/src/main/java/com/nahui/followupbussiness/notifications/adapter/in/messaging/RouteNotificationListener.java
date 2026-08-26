package com.nahui.followupbussiness.notifications.adapter.in.messaging;

import com.nahui.followupbussiness.notifications.application.port.in.ConsumeRouteNotificationUseCase;
import java.time.Instant;
import java.time.Clock;
import java.time.Duration;
import java.util.UUID;
import java.util.function.DoubleSupplier;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

public final class RouteNotificationListener {
    private static final Duration DELIVERY_TTL = Duration.ofHours(24);
    private final ConsumeRouteNotificationUseCase consumer; private final ObjectMapper json; private final RabbitTemplate rabbit; private final Clock clock; private final DoubleSupplier random; private final MeterRegistry meters;
    public RouteNotificationListener(ConsumeRouteNotificationUseCase consumer, ObjectMapper json, RabbitTemplate rabbit, Clock clock, MeterRegistry meters) { this(consumer, json, rabbit, clock, Math::random, meters); }
    RouteNotificationListener(ConsumeRouteNotificationUseCase consumer, ObjectMapper json, RabbitTemplate rabbit, Clock clock, DoubleSupplier random, MeterRegistry meters) { this.consumer=consumer; this.json=json; this.rabbit=rabbit; this.clock=clock; this.random=random; this.meters=meters; }
    @RabbitListener(queues = "${followupbussiness.notifications.work-queue:route.notifications.v1}")
    public void receive(Message message) {
        try { JsonNode r=json.readTree(message.getBody()); JsonNode p=r.path("payload");
            if (!"routing".equals(r.path("producer").asText()) || !"route-notification/v1".equals(r.path("schemaVersion").asText())) return;
            boolean notify=!p.has("notifySeller") || p.path("notifySeller").asBoolean();
            for (JsonNode recipient : p.path("recipientTechnicalIds")) consumer.consume(new ConsumeRouteNotificationUseCase.Command(UUID.fromString(r.path("eventId").asText()),r.path("eventType").asText(),r.path("version").asInt(),Instant.parse(r.path("occurredAt").asText()),UUID.fromString(r.path("tenantId").asText()),UUID.fromString(r.path("correlationId").asText()),UUID.fromString(p.path("routeId").asText()),Long.parseLong(p.path("routeVersion").asText()),UUID.fromString(recipient.asText()),notify));
        } catch (com.nahui.followupbussiness.notifications.application.ConsumeRouteNotificationService.TransientPushFailure failure) { retryOrDlq(message); }
        catch (com.nahui.followupbussiness.notifications.application.ConsumeRouteNotificationService.PermanentPushFailure failure) { dlq(message, "permanent_failure"); }
        catch (Exception ignored) { dlq(message, "invalid_message"); }
    }
    private void retryOrDlq(Message m) { long attempt=attempts(m)+1; if(attempt>=8){dlq(m, "attempts_exhausted");return;} long base=Math.min(1_000L << Math.min(attempt-1,8),300_000L); long delay=base+(long)(random.getAsDouble()*(base/4.0)); if (!canRetryBeforeExpiry(m, delay)) { dlq(m, "expired"); return; } m.getMessageProperties().setHeader("x-route-notification-attempt",attempt); m.getMessageProperties().setExpiration(Long.toString(delay)); rabbit.send("followupbussiness.events","route.notifications.retry.v1",m); }
    private boolean canRetryBeforeExpiry(Message message, long delayMillis) { try { Instant occurredAt=Instant.parse(json.readTree(message.getBody()).path("occurredAt").asText()); return clock.instant().plusMillis(delayMillis).isBefore(occurredAt.plus(DELIVERY_TTL)); } catch (Exception ignored) { return false; } }
    private void dlq(Message m, String outcome) { long attempt=attempts(m)+1; var properties = new org.springframework.amqp.core.MessageProperties(); properties.setContentType(org.springframework.amqp.core.MessageProperties.CONTENT_TYPE_JSON); String diagnostic = "{\"schemaVersion\":\"route-notification-dlq/v1\",\"outcome\":\"" + outcome + "\",\"attempt\":" + attempt + "}"; rabbit.send("followupbussiness.events", "route.notifications.dlq.v1", new Message(diagnostic.getBytes(java.nio.charset.StandardCharsets.UTF_8), properties)); meters.counter("notifications.route.delivery.failures", "outcome", outcome).increment(); }
    private static long attempts(Message m) { Object v=m.getMessageProperties().getHeaders().get("x-route-notification-attempt"); return v instanceof Number n?n.longValue():0L; }
}
