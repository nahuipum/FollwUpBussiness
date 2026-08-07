package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.domain.PublicationFailureKind;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/** Appends company-user events atomically with identity changes; publishing remains owned by outbox. */
public final class JdbcCompanyUserOutboxStore implements OutboxStore {
    private final JdbcTemplate jdbc;
    public JdbcCompanyUserOutboxStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public void append(OutboxEvent event) {
        jdbc.update("""
                INSERT INTO transactional_outbox (event_id,event_type,event_version,occurred_at,tenant_id,correlation_id,causation_id,payload,status,next_attempt_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,CAST(? AS jsonb),'PENDING',?,?,?)
                """, event.eventId(), event.eventType(), event.version(), Timestamp.from(event.occurredAt()), event.tenantId(),
                event.correlationId(), event.causationId(), event.payloadJson(), Timestamp.from(event.occurredAt()), Timestamp.from(event.occurredAt()), Timestamp.from(event.occurredAt()));
    }
    @Override public List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit) { throw new UnsupportedOperationException(); }
    @Override public boolean markPublished(UUID eventId, UUID leaseToken, Instant publishedAt) { throw new UnsupportedOperationException(); }
    @Override public boolean scheduleRetry(UUID eventId, UUID leaseToken, Instant nextAttemptAt, String failureType, String failureDetail) { throw new UnsupportedOperationException(); }
    @Override public boolean moveToDlq(UUID eventId, UUID leaseToken, Instant terminalAt, PublicationFailureKind failureKind, String failureType, String failureDetail) { throw new UnsupportedOperationException(); }
    @Override public int moveExpiredLeasesToDlqAtMaxAttempts(Instant now) { throw new UnsupportedOperationException(); }
    @Override public boolean reprocessFromDlq(UUID eventId, UUID operatorId, Instant reprocessedAt) { throw new UnsupportedOperationException(); }
    @Override public long dlqDepth() { throw new UnsupportedOperationException(); }
    @Override public long oldestDlqAgeSeconds(Instant now) { throw new UnsupportedOperationException(); }
    @Override public long countReadyToPublish() { throw new UnsupportedOperationException(); }
    @Override public long oldestReadyAgeSeconds(Instant now) { throw new UnsupportedOperationException(); }
    @Override public int deleteCompletedBefore(Instant cutoff) { throw new UnsupportedOperationException(); }
}
