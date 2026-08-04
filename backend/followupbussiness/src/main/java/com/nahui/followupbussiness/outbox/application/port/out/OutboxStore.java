package com.nahui.followupbussiness.outbox.application.port.out;

import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.domain.PublicationFailureKind;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface OutboxStore {
    void append(OutboxEvent event);

    List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit);

    default List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit, int maxAttempts) {
        return claimAvailable(now, leaseExpiresAt, limit);
    }

    boolean markPublished(UUID eventId, UUID leaseToken, Instant publishedAt);

    boolean scheduleRetry(UUID eventId, UUID leaseToken, Instant nextAttemptAt, String failureType, String failureDetail);

    boolean moveToDlq(UUID eventId, UUID leaseToken, Instant terminalAt, PublicationFailureKind failureKind,
                      String failureType, String failureDetail);

    int moveExpiredLeasesToDlqAtMaxAttempts(Instant now);

    default int moveExpiredLeasesToDlqAtMaxAttempts(Instant now, int maxAttempts) {
        return moveExpiredLeasesToDlqAtMaxAttempts(now);
    }

    boolean reprocessFromDlq(UUID eventId, UUID operatorId, Instant reprocessedAt);

    long dlqDepth();

    long oldestDlqAgeSeconds(Instant now);

    long countReadyToPublish();

    long oldestReadyAgeSeconds(Instant now);

    int deleteCompletedBefore(Instant cutoff);
}
