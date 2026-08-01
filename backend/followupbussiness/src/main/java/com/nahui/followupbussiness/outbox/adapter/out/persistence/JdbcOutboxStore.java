package com.nahui.followupbussiness.outbox.adapter.out.persistence;

import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class JdbcOutboxStore implements OutboxStore {
    private final JdbcTemplate jdbcTemplate;

    public JdbcOutboxStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void append(OutboxEvent event) {
        jdbcTemplate.update(
                """
                INSERT INTO transactional_outbox (
                    event_id, event_type, event_version, occurred_at, tenant_id, correlation_id, causation_id,
                    payload, status, next_attempt_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), 'PENDING', ?, ?, ?)
                """,
                event.eventId(), event.eventType(), event.version(), Timestamp.from(event.occurredAt()),
                event.tenantId(), event.correlationId(), event.causationId(), event.payloadJson(),
                Timestamp.from(event.occurredAt()), Timestamp.from(event.occurredAt()), Timestamp.from(event.occurredAt()));
    }

    @Override
    public List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit) {
        UUID leaseToken = UUID.randomUUID();
        return jdbcTemplate.query(
                """
                WITH claimable AS (
                    SELECT event_id
                    FROM transactional_outbox
                    WHERE (status IN ('PENDING', 'RETRY_SCHEDULED') AND next_attempt_at <= ?)
                       OR (status = 'CLAIMED' AND lease_expires_at <= ? AND attempt_count < 8)
                    ORDER BY next_attempt_at, created_at, event_id
                    FOR UPDATE SKIP LOCKED
                    LIMIT ?
                )
                UPDATE transactional_outbox outbox
                SET status = 'CLAIMED',
                    attempt_count = attempt_count + 1,
                    lease_token = ?,
                    lease_expires_at = ?,
                    updated_at = ?
                FROM claimable
                WHERE outbox.event_id = claimable.event_id
                RETURNING outbox.*
                """,
                JdbcOutboxStore::mapClaimed,
                Timestamp.from(now), Timestamp.from(now), limit, leaseToken,
                Timestamp.from(leaseExpiresAt), Timestamp.from(now));
    }

    @Override
    public boolean markPublished(UUID eventId, UUID leaseToken, Instant publishedAt) {
        return jdbcTemplate.update(
                """
                UPDATE transactional_outbox
                SET status = 'PUBLISHED', published_at = ?, lease_token = NULL, lease_expires_at = NULL,
                    failure_type = NULL, failure_detail = NULL, updated_at = ?
                WHERE event_id = ? AND status = 'CLAIMED' AND lease_token = ?
                """,
                Timestamp.from(publishedAt), Timestamp.from(publishedAt), eventId, leaseToken) == 1;
    }

    @Override
    public boolean scheduleRetry(UUID eventId, UUID leaseToken, Instant nextAttemptAt, String failureType, String failureDetail) {
        return jdbcTemplate.update(
                """
                UPDATE transactional_outbox
                SET status = 'RETRY_SCHEDULED', next_attempt_at = ?, lease_token = NULL, lease_expires_at = NULL,
                    failure_type = ?, failure_detail = ?, updated_at = ?
                WHERE event_id = ? AND status = 'CLAIMED' AND lease_token = ?
                """,
                Timestamp.from(nextAttemptAt), failureType, failureDetail, Timestamp.from(nextAttemptAt), eventId, leaseToken) == 1;
    }

    @Override
    public boolean markTerminal(UUID eventId, UUID leaseToken, Instant terminalAt, String failureType, String failureDetail) {
        return jdbcTemplate.update(
                """
                UPDATE transactional_outbox
                SET status = 'TERMINAL', terminal_at = ?, lease_token = NULL, lease_expires_at = NULL,
                    failure_type = ?, failure_detail = ?, updated_at = ?
                WHERE event_id = ? AND status = 'CLAIMED' AND lease_token = ?
                """,
                Timestamp.from(terminalAt), failureType, failureDetail, Timestamp.from(terminalAt), eventId, leaseToken) == 1;
    }

    @Override
    public int terminalExpiredLeasesAtMaxAttempts(Instant now) {
        return jdbcTemplate.update(
                """
                UPDATE transactional_outbox
                SET status = 'TERMINAL', terminal_at = ?, lease_token = NULL, lease_expires_at = NULL,
                    failure_type = 'LEASE_EXPIRED_MAX_ATTEMPTS', failure_detail = 'PUBLISH_FAILURE', updated_at = ?
                WHERE status = 'CLAIMED' AND lease_expires_at <= ? AND attempt_count >= 8
                """,
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));
    }

    @Override
    public long countReadyToPublish() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactional_outbox WHERE status IN ('PENDING', 'RETRY_SCHEDULED')", Long.class);
        return count == null ? 0 : count;
    }

    @Override
    public long oldestReadyAgeSeconds(Instant now) {
        Instant oldest = jdbcTemplate.queryForObject(
                "SELECT MIN(created_at) FROM transactional_outbox WHERE status IN ('PENDING', 'RETRY_SCHEDULED')",
                Instant.class);
        return oldest == null ? 0 : Math.max(0, now.getEpochSecond() - oldest.getEpochSecond());
    }

    @Override
    public int deleteCompletedBefore(Instant cutoff) {
        return jdbcTemplate.update(
                """
                DELETE FROM transactional_outbox
                WHERE (status = 'PUBLISHED' AND published_at < ?)
                   OR (status = 'TERMINAL' AND terminal_at < ?)
                """,
                Timestamp.from(cutoff), Timestamp.from(cutoff));
    }

    private static ClaimedOutboxEvent mapClaimed(ResultSet resultSet, int rowNumber) throws SQLException {
        OutboxEvent event = new OutboxEvent(
                resultSet.getObject("event_id", UUID.class),
                resultSet.getString("event_type"),
                resultSet.getInt("event_version"),
                resultSet.getTimestamp("occurred_at").toInstant(),
                resultSet.getObject("tenant_id", UUID.class),
                resultSet.getObject("correlation_id", UUID.class),
                resultSet.getObject("causation_id", UUID.class),
                resultSet.getString("payload"));
        return new ClaimedOutboxEvent(
                event,
                resultSet.getObject("lease_token", UUID.class),
                resultSet.getInt("attempt_count"),
                resultSet.getTimestamp("lease_expires_at").toInstant());
    }
}
