package com.nahui.followupbussiness.outbox.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record ClaimedOutboxEvent(
        OutboxEvent event,
        UUID leaseToken,
        int attemptCount,
        Instant leaseExpiresAt) {

    public ClaimedOutboxEvent {
        Objects.requireNonNull(event, "event is required");
        Objects.requireNonNull(leaseToken, "leaseToken is required");
        if (attemptCount < 1 || attemptCount > 8) {
            throw new IllegalArgumentException("attemptCount must be between 1 and 8");
        }
        Objects.requireNonNull(leaseExpiresAt, "leaseExpiresAt is required");
    }
}
