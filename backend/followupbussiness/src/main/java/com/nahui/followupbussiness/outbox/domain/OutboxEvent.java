package com.nahui.followupbussiness.outbox.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record OutboxEvent(
        UUID eventId,
        String eventType,
        int version,
        Instant occurredAt,
        UUID tenantId,
        UUID correlationId,
        UUID causationId,
        String payloadJson) {

    public OutboxEvent {
        Objects.requireNonNull(eventId, "eventId is required");
        if (eventType == null || eventType.isBlank() || eventType.length() > 160) {
            throw new IllegalArgumentException("eventType must contain at most 160 characters");
        }
        if (version <= 0) {
            throw new IllegalArgumentException("version must be positive");
        }
        Objects.requireNonNull(occurredAt, "occurredAt is required");
        Objects.requireNonNull(tenantId, "tenantId is required");
        Objects.requireNonNull(correlationId, "correlationId is required");
        Objects.requireNonNull(causationId, "causationId is required");
        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IllegalArgumentException("payloadJson is required");
        }
    }
}
