package com.nahui.followupbussiness.outbox.adapter.out.messaging;

import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.ReturnedMessage;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentCaptor.forClass;

class RabbitMqEventTransportTest {
    @Test
    void publishesTheVersionedEnvelopeAndTechnicalHeadersWithoutLoggingPayload() throws Exception {
        RabbitTemplate template = mock(RabbitTemplate.class);
        doAnswer(invocation -> {
            CorrelationData correlation = invocation.getArgument(3);
            correlation.getFuture().complete(new CorrelationData.Confirm(true, null));
            return null;
        }).when(template).send(any(String.class), any(String.class), any(Message.class), any(CorrelationData.class));
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "visit.started", 1, Instant.parse("2026-08-01T12:00:00Z"),
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "{\"visitId\":\"abc\"}");

        new RabbitMqEventTransport(template, new ObjectMapper(), "followupbussiness.events").publish(event);

        org.mockito.ArgumentCaptor<Message> message = forClass(Message.class);
        verify(template).send(eq("followupbussiness.events"), eq("visit.started"), message.capture(), any(CorrelationData.class));
        JsonNode envelope = new ObjectMapper().readTree(new String(message.getValue().getBody(), StandardCharsets.UTF_8));
        assertThat(envelope.path("eventId").asText()).isEqualTo(event.eventId().toString());
        assertThat(envelope.path("tenantId").asText()).isEqualTo(event.tenantId().toString());
        assertThat(envelope.path("correlationId").asText()).isEqualTo(event.correlationId().toString());
        assertThat(envelope.path("causationId").asText()).isEqualTo(event.causationId().toString());
        assertThat(envelope.path("payload").path("visitId").asText()).isEqualTo("abc");
        assertThat(message.getValue().getMessageProperties().getHeaders()).containsEntry("eventId", event.eventId().toString());
        assertThat(message.getValue().getMessageProperties().getHeaders()).containsEntry("tenantId", event.tenantId().toString());
    }

    @Test
    void rejectsNegativePublisherConfirmInsteadOfReportingPublication() {
        RabbitTemplate template = mock(RabbitTemplate.class);
        doAnswer(invocation -> {
            CorrelationData correlation = invocation.getArgument(3);
            correlation.getFuture().complete(new CorrelationData.Confirm(false, "broker uncertain"));
            return null;
        }).when(template).send(any(String.class), any(String.class), any(Message.class), any(CorrelationData.class));
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "visit.started", 1, Instant.now(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), "{}");

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> new RabbitMqEventTransport(template, new ObjectMapper(), "followupbussiness.events").publish(event))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void classifiesReturnedPublicationAsUnroutable() {
        RabbitTemplate template = mock(RabbitTemplate.class);
        doAnswer(invocation -> {
            CorrelationData correlation = invocation.getArgument(3);
            correlation.setReturned(new ReturnedMessage(invocation.getArgument(2), 312, "NO_ROUTE", "events", "missing"));
            correlation.getFuture().complete(new CorrelationData.Confirm(true, null));
            return null;
        }).when(template).send(any(String.class), any(String.class), any(Message.class), any(CorrelationData.class));
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "visit.started", 1, Instant.now(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "{}");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> new RabbitMqEventTransport(template, new ObjectMapper(), "events").publish(event))
                .isInstanceOf(com.nahui.followupbussiness.outbox.domain.UnroutablePublicationException.class);
    }
}
