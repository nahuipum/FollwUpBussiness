package com.nahui.followupbussiness.outbox.adapter.out.messaging;

import com.nahui.followupbussiness.outbox.application.port.out.EventTransport;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public final class RabbitMqEventTransport implements EventTransport {
    private static final long CONFIRM_TIMEOUT_SECONDS = 5;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final String exchange;

    public RabbitMqEventTransport(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper, String exchange) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
        this.exchange = exchange;
    }

    @Override
    public void publish(OutboxEvent event) {
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        properties.setHeader("eventId", event.eventId().toString());
        properties.setHeader("correlationId", event.correlationId().toString());
        properties.setHeader("tenantId", event.tenantId().toString());
        CorrelationData correlation = new CorrelationData(event.eventId().toString());
        rabbitTemplate.send(exchange, event.eventType(), new Message(envelope(event).getBytes(StandardCharsets.UTF_8), properties), correlation);
        awaitPositiveConfirm(correlation);
    }

    private static void awaitPositiveConfirm(CorrelationData correlation) {
        try {
            CorrelationData.Confirm confirm = correlation.getFuture().get(CONFIRM_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!confirm.isAck() || correlation.getReturned() != null) {
                throw new IllegalStateException("RabbitMQ publication was not confirmed");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("RabbitMQ publication confirmation interrupted", exception);
        } catch (ExecutionException | TimeoutException exception) {
            throw new IllegalStateException("RabbitMQ publication confirmation unavailable", exception);
        }
    }

    private String envelope(OutboxEvent event) {
        try {
            JsonNode payload = objectMapper.readTree(event.payloadJson());
            ObjectNode envelope = objectMapper.createObjectNode();
            envelope.put("eventId", event.eventId().toString());
            envelope.put("eventType", event.eventType());
            envelope.put("version", event.version());
            envelope.put("occurredAt", event.occurredAt().toString());
            envelope.put("tenantId", event.tenantId().toString());
            envelope.put("correlationId", event.correlationId().toString());
            envelope.put("causationId", event.causationId().toString());
            envelope.set("payload", payload);
            return objectMapper.writeValueAsString(envelope);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("Outbox payload must be valid JSON", exception);
        }
    }
}
