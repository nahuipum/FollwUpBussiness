package com.nahui.followupbussiness.notifications.adapter.in.messaging;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.nahui.followupbussiness.notifications.application.ConsumeRouteNotificationService.TransientPushFailure;
import com.nahui.followupbussiness.notifications.application.ConsumeRouteNotificationService.PermanentPushFailure;
import com.nahui.followupbussiness.notifications.application.port.in.ConsumeRouteNotificationUseCase;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import tools.jackson.databind.ObjectMapper;

class RouteNotificationListenerTest {
    private static final Instant NOW = Instant.parse("2026-08-25T12:00:00Z");

    @Test void retriesEachTransientRedeliveryAndMovesTheEighthFailureToDlq() {
        var consumer=mock(ConsumeRouteNotificationUseCase.class); var rabbit=mock(RabbitTemplate.class);
        doThrow(new TransientPushFailure()).when(consumer).consume(any());
        var listener=listener(consumer, rabbit);
        var message=message(NOW.minusSeconds(60));
        for (int attempt=0; attempt<8; attempt++) listener.receive(message);
        verify(consumer,times(8)).consume(any());
        verify(rabbit,times(7)).send(eq("followupbussiness.events"),eq("route.notifications.retry.v1"),eq(message));
        verifySanitizedDlq(rabbit, "attempts_exhausted", 8);
    }

    @Test void sendsToDlqInsteadOfSchedulingRetryThatWouldPassTheTtl() {
        var consumer=mock(ConsumeRouteNotificationUseCase.class); var rabbit=mock(RabbitTemplate.class);
        doThrow(new TransientPushFailure()).when(consumer).consume(any());
        var listener=listener(consumer, rabbit);
        var message=message(NOW.minusSeconds(86_400).plusMillis(500));
        listener.receive(message);
        verify(rabbit,never()).send(eq("followupbussiness.events"),eq("route.notifications.retry.v1"),any(Message.class));
        verifySanitizedDlq(rabbit, "expired", 1);
    }

    @Test void sendsToDlqWithoutSchedulingWhenTheRetryWouldEqualTheTtl() {
        var consumer=mock(ConsumeRouteNotificationUseCase.class); var rabbit=mock(RabbitTemplate.class);
        doThrow(new TransientPushFailure()).when(consumer).consume(any());
        var listener=new RouteNotificationListener(consumer,new ObjectMapper(),rabbit,Clock.fixed(NOW,ZoneOffset.UTC),() -> 0.0d, new SimpleMeterRegistry());
        var message=message(NOW.minusSeconds(86_400).plusSeconds(1));
        listener.receive(message);
        verify(rabbit,never()).send(eq("followupbussiness.events"),eq("route.notifications.retry.v1"),any(Message.class));
        verifySanitizedDlq(rabbit, "expired", 1);
    }

    @Test void sendsOnlySanitizedDiagnosticForPermanentFailure() {
        var consumer=mock(ConsumeRouteNotificationUseCase.class); var rabbit=mock(RabbitTemplate.class);
        doThrow(new PermanentPushFailure()).when(consumer).consume(any());
        listener(consumer, rabbit).receive(message(NOW.minusSeconds(60)));
        verify(rabbit, never()).send(eq("followupbussiness.events"),eq("route.notifications.retry.v1"),any(Message.class));
        verifySanitizedDlq(rabbit, "permanent_failure", 1);
    }

    @Test void rejectsMissingOrWrongProducerBeforeConsumerOrBrokerEffects() {
        var consumer=mock(ConsumeRouteNotificationUseCase.class); var rabbit=mock(RabbitTemplate.class);
        var listener=listener(consumer, rabbit);
        listener.receive(message(NOW.minusSeconds(60), "other"));
        verify(consumer, never()).consume(any());
        verify(rabbit, never()).send(any(), any(), any(Message.class));
    }

    @Test void recordsOnlySafeOutcomeTagWhenDeliveryMovesToDlq() {
        var consumer=mock(ConsumeRouteNotificationUseCase.class); var rabbit=mock(RabbitTemplate.class); var meters=new SimpleMeterRegistry();
        doThrow(new TransientPushFailure()).when(consumer).consume(any());
        var listener=new RouteNotificationListener(consumer,new ObjectMapper(),rabbit,Clock.fixed(NOW,ZoneOffset.UTC),() -> 0.0d, meters);
        listener.receive(message(NOW.minusSeconds(86_400).plusSeconds(1)));
        org.assertj.core.api.Assertions.assertThat(meters.find("notifications.route.delivery.failures").tag("outcome", "expired").counter().count()).isEqualTo(1.0d);
    }

    private static Message message(Instant occurredAt) {
        return message(occurredAt, "routing");
    }
    private static Message message(Instant occurredAt, String producer) {
        UUID event=UUID.randomUUID(), tenant=UUID.randomUUID(), correlation=UUID.randomUUID(), route=UUID.randomUUID(), recipient=UUID.randomUUID();
        String body="{\"producer\":\""+producer+"\",\"schemaVersion\":\"route-notification/v1\",\"eventId\":\""+event+"\",\"eventType\":\"route.published\",\"version\":1,\"occurredAt\":\""+occurredAt+"\",\"tenantId\":\""+tenant+"\",\"correlationId\":\""+correlation+"\",\"payload\":{\"routeId\":\""+route+"\",\"routeVersion\":\"2\",\"recipientTechnicalIds\":[\""+recipient+"\"]}}";
        return new Message(body.getBytes(StandardCharsets.UTF_8),new MessageProperties());
    }
    private static RouteNotificationListener listener(ConsumeRouteNotificationUseCase consumer, RabbitTemplate rabbit) { return new RouteNotificationListener(consumer, new ObjectMapper(), rabbit, Clock.fixed(NOW,ZoneOffset.UTC), new SimpleMeterRegistry()); }
    private static void verifySanitizedDlq(RabbitTemplate rabbit, String outcome, long attempt) {
        var captor=org.mockito.ArgumentCaptor.forClass(Message.class);
        verify(rabbit).send(eq("followupbussiness.events"),eq("route.notifications.dlq.v1"),captor.capture());
        String body=new String(captor.getValue().getBody(), StandardCharsets.UTF_8);
        org.assertj.core.api.Assertions.assertThat(body).isEqualTo("{\"schemaVersion\":\"route-notification-dlq/v1\",\"outcome\":\""+outcome+"\",\"attempt\":"+attempt+"}");
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getMessageProperties().getHeaders()).isEmpty();
    }
}
