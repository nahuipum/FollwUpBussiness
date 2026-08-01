package com.nahui.followupbussiness.outbox.application.port.out;

import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface OutboxStore {
    void append(OutboxEvent event);

    List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit);

    boolean markPublished(UUID eventId, UUID leaseToken, Instant publishedAt);

    boolean scheduleRetry(UUID eventId, UUID leaseToken, Instant nextAttemptAt, String failureType, String failureDetail);

    boolean markTerminal(UUID eventId, UUID leaseToken, Instant terminalAt, String failureType, String failureDetail);

    int terminalExpiredLeasesAtMaxAttempts(Instant now);

    long countReadyToPublish();

    long oldestReadyAgeSeconds(Instant now);

    int deleteCompletedBefore(Instant cutoff);
}
