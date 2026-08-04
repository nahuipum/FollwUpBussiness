package com.nahui.followupbussiness.outbox.domain;

import java.time.Duration;
import java.util.Objects;

/** Bounded retry policy for durable outbox publication. */
public record RetryPolicy(int maxAttempts, Duration initialBackoff, Duration maxBackoff) {
    public static final RetryPolicy DEFAULT = new RetryPolicy(8, Duration.ofSeconds(1), Duration.ofMinutes(5));

    public RetryPolicy {
        if (maxAttempts < 1 || maxAttempts > 8) {
            throw new IllegalArgumentException("maxAttempts must be between 1 and 8");
        }
        Objects.requireNonNull(initialBackoff, "initialBackoff is required");
        Objects.requireNonNull(maxBackoff, "maxBackoff is required");
        if (initialBackoff.isZero() || initialBackoff.isNegative()
                || maxBackoff.isZero() || maxBackoff.isNegative()
                || initialBackoff.compareTo(maxBackoff) > 0) {
            throw new IllegalArgumentException("backoff durations must be positive and initialBackoff must not exceed maxBackoff");
        }
    }
}
