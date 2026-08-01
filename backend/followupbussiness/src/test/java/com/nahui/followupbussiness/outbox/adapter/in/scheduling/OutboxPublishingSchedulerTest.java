package com.nahui.followupbussiness.outbox.adapter.in.scheduling;

import com.nahui.followupbussiness.outbox.application.OutboxPublisher;
import com.nahui.followupbussiness.outbox.application.port.out.EventTransport;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxPublishingSchedulerTest {
    private static final Instant NOW = Instant.parse("2026-08-01T12:00:00Z");

    @Test
    void incrementsPublishFailureMetricForEachTransportFailureHandledPerEvent() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        FailingEventStore store = new FailingEventStore();
        OutboxPublisher publisher = new OutboxPublisher(store, failingTransport(),
                Clock.fixed(NOW, ZoneOffset.UTC), new Random(17));
        OutboxPublishingScheduler scheduler = new OutboxPublishingScheduler(
                publisher, 10, Duration.ofSeconds(30),
                registry.counter("outbox.events.published"),
                registry.counter("outbox.events.retry_scheduled"),
                registry.counter("outbox.events.terminal"),
                store, Clock.fixed(NOW, ZoneOffset.UTC),
                registry.counter("outbox.events.retention_deleted"),
                registry.counter("outbox.publish.failures"));

        scheduler.publishAvailable();

        assertThat(registry.get("outbox.publish.failures").counter().count()).isEqualTo(2.0);
    }

    private static EventTransport failingTransport() {
        return ignored -> { throw new IllegalStateException("broker unavailable"); };
    }

    private static final class FailingEventStore implements OutboxStore {
        private final List<ClaimedOutboxEvent> claimed = List.of(event(), event());

        private static ClaimedOutboxEvent event() {
            return new ClaimedOutboxEvent(
                new OutboxEvent(UUID.randomUUID(), "route.published", 1, NOW, UUID.randomUUID(), UUID.randomUUID(),
                        UUID.randomUUID(), "{\"routeId\":\"redacted\"}"),
                UUID.randomUUID(), 1, NOW.plusSeconds(30));
        }

        @Override public void append(OutboxEvent event) { }
        @Override public List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit) { return claimed; }
        @Override public boolean markPublished(UUID eventId, UUID leaseToken, Instant publishedAt) { return false; }
        @Override public boolean scheduleRetry(UUID eventId, UUID leaseToken, Instant nextAttemptAt, String failureType, String failureDetail) { return true; }
        @Override public boolean markTerminal(UUID eventId, UUID leaseToken, Instant terminalAt, String failureType, String failureDetail) { return true; }
        @Override public int terminalExpiredLeasesAtMaxAttempts(Instant now) { return 0; }
        @Override public long countReadyToPublish() { return 0; }
        @Override public long oldestReadyAgeSeconds(Instant now) { return 0; }
        @Override public int deleteCompletedBefore(Instant cutoff) { return 0; }
    }
}
