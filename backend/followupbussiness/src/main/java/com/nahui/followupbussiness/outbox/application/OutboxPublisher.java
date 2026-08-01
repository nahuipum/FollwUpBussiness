package com.nahui.followupbussiness.outbox.application;

import com.nahui.followupbussiness.outbox.application.port.out.EventTransport;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Random;

public final class OutboxPublisher {
    private static final Logger LOGGER = LoggerFactory.getLogger(OutboxPublisher.class);
    static final int MAX_ATTEMPTS = 8;
    private static final Duration BASE_BACKOFF = Duration.ofSeconds(1);
    private static final Duration MAX_BACKOFF = Duration.ofMinutes(5);

    private final OutboxStore outboxStore;
    private final EventTransport eventTransport;
    private final Clock clock;
    private final Random random;

    public OutboxPublisher(OutboxStore outboxStore, EventTransport eventTransport, Clock clock, Random random) {
        this.outboxStore = Objects.requireNonNull(outboxStore);
        this.eventTransport = Objects.requireNonNull(eventTransport);
        this.clock = Objects.requireNonNull(clock);
        this.random = Objects.requireNonNull(random);
    }

    public DispatchResult dispatchAvailable(int limit, Duration leaseDuration) {
        if (limit < 1 || leaseDuration.isNegative() || leaseDuration.isZero()) {
            throw new IllegalArgumentException("limit and leaseDuration must be positive");
        }
        Instant now = clock.instant();
        int terminal = outboxStore.terminalExpiredLeasesAtMaxAttempts(now);
        List<ClaimedOutboxEvent> claimed = outboxStore.claimAvailable(now, now.plus(leaseDuration), limit);
        int published = 0;
        int retried = 0;
        int failures = 0;
        for (ClaimedOutboxEvent event : claimed) {
            try {
                eventTransport.publish(event.event());
                if (outboxStore.markPublished(event.event().eventId(), event.leaseToken(), clock.instant())) {
                    published++;
                    logResult(event, "PUBLISHED", null);
                }
            } catch (RuntimeException exception) {
                failures++;
                if (event.attemptCount() >= MAX_ATTEMPTS) {
                    if (outboxStore.markTerminal(event.event().eventId(), event.leaseToken(), clock.instant(),
                            exception.getClass().getSimpleName(), safeDetail(exception))) {
                        terminal++;
                        logResult(event, "TERMINAL", exception.getClass().getSimpleName());
                    }
                } else if (outboxStore.scheduleRetry(event.event().eventId(), event.leaseToken(),
                        clock.instant().plus(backoff(event.attemptCount())), exception.getClass().getSimpleName(),
                        safeDetail(exception))) {
                    retried++;
                    logResult(event, "RETRY_SCHEDULED", exception.getClass().getSimpleName());
                }
            }
        }
        return new DispatchResult(claimed.size(), published, retried, terminal, failures);
    }

    private Duration backoff(int attemptCount) {
        long exponent = 1L << Math.min(attemptCount - 1, 8);
        long cappedMillis = Math.min(BASE_BACKOFF.toMillis() * exponent, MAX_BACKOFF.toMillis());
        long jitter = random.nextLong(Math.max(1L, cappedMillis / 4 + 1));
        return Duration.ofMillis(cappedMillis + jitter);
    }

    private static String safeDetail(RuntimeException exception) {
        return "PUBLISH_FAILURE";
    }

    private static void logResult(ClaimedOutboxEvent event, String result, String errorType) {
        LOGGER.info("operation=outbox.publish eventId={} correlationId={} result={} errorType={}",
                event.event().eventId(), event.event().correlationId(), result, errorType);
    }

    public record DispatchResult(int claimed, int published, int retried, int terminal, int failures) { }
}
