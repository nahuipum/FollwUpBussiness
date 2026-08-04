package com.nahui.followupbussiness.outbox.application;

import com.nahui.followupbussiness.outbox.application.port.out.EventTransport;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.domain.PublicationFailureKind;
import com.nahui.followupbussiness.outbox.domain.RetryPolicy;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxPublisherTest {
    private static final Instant NOW = Instant.parse("2026-08-01T12:00:00Z");

    @Test
    void publishesClaimedEventOnceAndMarksItPublishedWithItsLease() {
        FakeStore store = new FakeStore(claimed(1));
        List<OutboxEvent> sent = new ArrayList<>();
        OutboxPublisher publisher = publisher(store, sent::add);

        OutboxPublisher.DispatchResult result = publisher.dispatchAvailable(10, Duration.ofSeconds(30));

        assertThat(result).isEqualTo(new OutboxPublisher.DispatchResult(1, 1, 0, 0, 0));
        assertThat(sent).containsExactly(store.claimed.getFirst().event());
        assertThat(store.published).containsExactly(store.claimed.getFirst().event().eventId());
        assertThat(store.retried).isEmpty();
        assertThat(store.terminal).isEmpty();
    }

    @Test
    void schedulesBoundedRetryAfterTransportFailure() {
        FakeStore store = new FakeStore(claimed(2));
        OutboxPublisher publisher = publisher(store, ignored -> { throw new IllegalStateException("broker unavailable"); });

        OutboxPublisher.DispatchResult result = publisher.dispatchAvailable(10, Duration.ofSeconds(30));

        assertThat(result).isEqualTo(new OutboxPublisher.DispatchResult(1, 0, 1, 0, 1));
        assertThat(store.retried).containsExactly(store.claimed.getFirst().event().eventId());
        assertThat(store.failureTypes).containsExactly("IllegalStateException");
        assertThat(store.failureDetails).containsExactly("PUBLISH_FAILURE");
    }

    @Test
    void makesTheEighthFailedAttemptTerminalInsteadOfSchedulingInfiniteRetries() {
        FakeStore store = new FakeStore(claimed(8));
        OutboxPublisher publisher = publisher(store, ignored -> { throw new IllegalStateException("broker unavailable"); });

        OutboxPublisher.DispatchResult result = publisher.dispatchAvailable(10, Duration.ofSeconds(30));

        assertThat(result).isEqualTo(new OutboxPublisher.DispatchResult(1, 0, 0, 1, 1));
        assertThat(store.dlq).containsExactly(store.claimed.getFirst().event().eventId());
        assertThat(store.retried).isEmpty();
    }

    @Test
    void sendsPermanentInvalidEnvelopeFailureDirectlyToDlq() {
        FakeStore store = new FakeStore(claimed(1));
        OutboxPublisher publisher = publisher(store, ignored -> { throw new IllegalArgumentException("invalid payload"); });

        OutboxPublisher.DispatchResult result = publisher.dispatchAvailable(10, Duration.ofSeconds(30));

        assertThat(result).isEqualTo(new OutboxPublisher.DispatchResult(1, 0, 0, 1, 1));
        assertThat(store.dlq).containsExactly(store.claimed.getFirst().event().eventId());
        assertThat(store.retried).isEmpty();
    }

    @Test
    void appliesTheConfiguredAttemptLimitAndExponentialBackoff() {
        FakeStore store = new FakeStore(claimed(2));
        OutboxPublisher publisher = new OutboxPublisher(store,
                ignored -> { throw new IllegalStateException("broker unavailable"); },
                Clock.fixed(NOW, ZoneOffset.UTC), new Random(17),
                new RetryPolicy(3, Duration.ofSeconds(2), Duration.ofSeconds(4)));

        publisher.dispatchAvailable(10, Duration.ofSeconds(30));

        assertThat(store.nextAttemptAt).isBetween(NOW.plusSeconds(4), NOW.plusSeconds(5));
        store.claimed = List.of(claimed(3));
        assertThat(publisher.dispatchAvailable(10, Duration.ofSeconds(30)).terminal()).isEqualTo(1);
    }

    @Test
    void neverPersistsTheRawTransportExceptionMessage() {
        FakeStore store = new FakeStore(claimed(1));
        String sensitiveMessage = "token=secret customer=Ana";
        OutboxPublisher publisher = publisher(store, ignored -> { throw new IllegalStateException(sensitiveMessage); });

        publisher.dispatchAvailable(10, Duration.ofSeconds(30));

        assertThat(store.failureDetails).containsExactly("PUBLISH_FAILURE");
        assertThat(store.failureDetails).doesNotContain(sensitiveMessage);
    }

    private static OutboxPublisher publisher(FakeStore store, EventTransport transport) {
        return new OutboxPublisher(store, transport, Clock.fixed(NOW, ZoneOffset.UTC), new Random(17));
    }

    private static ClaimedOutboxEvent claimed(int attempts) {
        return new ClaimedOutboxEvent(
                new OutboxEvent(UUID.randomUUID(), "route.published", 1, NOW, UUID.randomUUID(), UUID.randomUUID(),
                        UUID.randomUUID(), "{\"routeId\":\"redacted\"}"),
                UUID.randomUUID(), attempts, NOW.plusSeconds(30));
    }

    private static final class FakeStore implements OutboxStore {
        private List<ClaimedOutboxEvent> claimed;
        private final List<UUID> published = new ArrayList<>();
        private final List<UUID> retried = new ArrayList<>();
        private final List<UUID> terminal = new ArrayList<>();
        private final List<UUID> dlq = new ArrayList<>();
        private final List<String> failureTypes = new ArrayList<>();
        private final List<String> failureDetails = new ArrayList<>();
        private Instant nextAttemptAt;

        private FakeStore(ClaimedOutboxEvent event) { this.claimed = List.of(event); }
        @Override public void append(OutboxEvent event) { }
        @Override public List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit) { return claimed; }
        @Override public boolean markPublished(UUID eventId, UUID leaseToken, Instant publishedAt) { published.add(eventId); return true; }
        @Override public boolean scheduleRetry(UUID eventId, UUID leaseToken, Instant nextAttemptAt, String failureType, String failureDetail) {
            retried.add(eventId); failureTypes.add(failureType); failureDetails.add(failureDetail); this.nextAttemptAt = nextAttemptAt; return true;
        }
        @Override public boolean moveToDlq(UUID eventId, UUID leaseToken, Instant terminalAt, PublicationFailureKind failureKind, String failureType, String failureDetail) {
            terminal.add(eventId); dlq.add(eventId); failureTypes.add(failureType); failureDetails.add(failureDetail); return true;
        }
        @Override public int moveExpiredLeasesToDlqAtMaxAttempts(Instant now) { return 0; }
        @Override public boolean reprocessFromDlq(UUID eventId, UUID operatorId, Instant reprocessedAt) { return false; }
        @Override public long dlqDepth() { return dlq.size(); }
        @Override public long oldestDlqAgeSeconds(Instant now) { return 0; }
        @Override public long countReadyToPublish() { return 0; }
        @Override public long oldestReadyAgeSeconds(Instant now) { return 0; }
        @Override public int deleteCompletedBefore(Instant cutoff) { return 0; }
    }
}
