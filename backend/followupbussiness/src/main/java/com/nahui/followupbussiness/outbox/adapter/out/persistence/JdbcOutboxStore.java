package com.nahui.followupbussiness.outbox.adapter.out.persistence;

import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.domain.PublicationFailureKind;
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
        return claimAvailable(now, leaseExpiresAt, limit, 8);
    }

    @Override
    public List<ClaimedOutboxEvent> claimAvailable(Instant now, Instant leaseExpiresAt, int limit, int maxAttempts) {
        UUID leaseToken = UUID.randomUUID();
        return jdbcTemplate.query(
                """
                WITH claimable AS (
                    SELECT event_id
                    FROM transactional_outbox
                    WHERE (status IN ('PENDING', 'RETRY_SCHEDULED') AND next_attempt_at <= ?)
                       OR (status = 'CLAIMED' AND lease_expires_at <= ? AND attempt_count < ?)
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
                Timestamp.from(now), Timestamp.from(now), maxAttempts, limit, leaseToken,
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
    public boolean moveToDlq(UUID eventId, UUID leaseToken, Instant terminalAt, PublicationFailureKind failureKind,
                             String failureType, String failureDetail) {
        return jdbcTemplate.update(
                """
                WITH terminalized AS (
                    UPDATE transactional_outbox
                    SET status = 'TERMINAL', terminal_at = ?, lease_token = NULL, lease_expires_at = NULL,
                        failure_type = ?, failure_detail = ?, updated_at = ?
                    WHERE event_id = ? AND status = 'CLAIMED' AND lease_token = ?
                    RETURNING event_id, tenant_id, correlation_id, causation_id, event_type, event_version,
                              occurred_at, payload, attempt_count, terminal_at, failure_type, failure_detail
                )
                INSERT INTO transactional_outbox_dlq (
                    event_id, tenant_id, correlation_id, causation_id, event_type, event_version, occurred_at,
                    payload, attempt_count, failure_kind, failure_type, failure_detail, entered_at
                )
                SELECT event_id, tenant_id, correlation_id, causation_id, event_type, event_version, occurred_at,
                       payload, attempt_count, ?, failure_type, failure_detail, terminal_at
                FROM terminalized
                ON CONFLICT (event_id) DO UPDATE
                SET tenant_id = EXCLUDED.tenant_id,
                    correlation_id = EXCLUDED.correlation_id,
                    causation_id = EXCLUDED.causation_id,
                    event_type = EXCLUDED.event_type,
                    event_version = EXCLUDED.event_version,
                    occurred_at = EXCLUDED.occurred_at,
                    payload = EXCLUDED.payload,
                    attempt_count = EXCLUDED.attempt_count,
                    failure_kind = EXCLUDED.failure_kind,
                    failure_type = EXCLUDED.failure_type,
                    failure_detail = EXCLUDED.failure_detail,
                    entered_at = EXCLUDED.entered_at
                """,
                Timestamp.from(terminalAt), failureType, failureDetail, Timestamp.from(terminalAt), eventId, leaseToken,
                failureKind.name()) == 1;
    }

    @Override
    public int moveExpiredLeasesToDlqAtMaxAttempts(Instant now) {
        return moveExpiredLeasesToDlqAtMaxAttempts(now, 8);
    }

    @Override
    public int moveExpiredLeasesToDlqAtMaxAttempts(Instant now, int maxAttempts) {
        return jdbcTemplate.update(
                """
                WITH terminalized AS (
                    UPDATE transactional_outbox
                    SET status = 'TERMINAL', terminal_at = ?, lease_token = NULL, lease_expires_at = NULL,
                        failure_type = 'LEASE_EXPIRED_MAX_ATTEMPTS', failure_detail = 'PUBLISH_FAILURE', updated_at = ?
                    WHERE status = 'CLAIMED' AND lease_expires_at <= ? AND attempt_count >= ?
                    RETURNING event_id, tenant_id, correlation_id, causation_id, event_type, event_version,
                              occurred_at, payload, attempt_count, terminal_at, failure_type, failure_detail
                )
                INSERT INTO transactional_outbox_dlq (
                    event_id, tenant_id, correlation_id, causation_id, event_type, event_version, occurred_at,
                    payload, attempt_count, failure_kind, failure_type, failure_detail, entered_at
                )
                SELECT event_id, tenant_id, correlation_id, causation_id, event_type, event_version, occurred_at,
                       payload, attempt_count, 'TRANSIENT', failure_type, failure_detail, terminal_at
                FROM terminalized
                ON CONFLICT (event_id) DO UPDATE
                SET attempt_count = EXCLUDED.attempt_count, failure_kind = EXCLUDED.failure_kind,
                    failure_type = EXCLUDED.failure_type, failure_detail = EXCLUDED.failure_detail,
                    entered_at = EXCLUDED.entered_at
                """,
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(now), maxAttempts);
    }

    @Override
    public boolean reprocessFromDlq(UUID eventId, UUID operatorId, Instant reprocessedAt) {
        return jdbcTemplate.update("""
                WITH locked AS MATERIALIZED (
                    SELECT pg_advisory_xact_lock(hashtextextended(?::text, 0))
                ), eligible AS (
                    UPDATE transactional_outbox_dlq
                    SET reprocess_count = reprocess_count + 1, last_reprocessed_by = ?, last_reprocessed_at = ?
                    FROM locked
                    WHERE event_id = ? AND reprocess_count < 3
                      AND EXISTS (SELECT 1 FROM transactional_outbox
                                  WHERE transactional_outbox.event_id = transactional_outbox_dlq.event_id
                                    AND status = 'TERMINAL')
                    RETURNING transactional_outbox_dlq.event_id
                ), audited AS (
                    INSERT INTO transactional_outbox_dlq_reprocess_audit (id, event_id, operator_id, reprocessed_at, result)
                    SELECT ?, event_id, ?, ?, 'REPROCESSED' FROM eligible
                    RETURNING event_id
                )
                UPDATE transactional_outbox
                SET status = 'PENDING', attempt_count = 0, next_attempt_at = ?, lease_token = NULL,
                    lease_expires_at = NULL, terminal_at = NULL, failure_type = NULL, failure_detail = NULL, updated_at = ?
                WHERE event_id IN (SELECT event_id FROM audited) AND status = 'TERMINAL'
                """, eventId.toString(), operatorId, Timestamp.from(reprocessedAt), eventId, UUID.randomUUID(), operatorId,
                Timestamp.from(reprocessedAt), Timestamp.from(reprocessedAt), Timestamp.from(reprocessedAt)) == 1;
    }

    @Override public long dlqDepth() { Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq", Long.class); return count == null ? 0 : count; }

    @Override public long oldestDlqAgeSeconds(Instant now) { Instant oldest = jdbcTemplate.queryForObject("SELECT MIN(entered_at) FROM transactional_outbox_dlq", Instant.class); return oldest == null ? 0 : Math.max(0, now.getEpochSecond() - oldest.getEpochSecond()); }

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
        Integer deleted = jdbcTemplate.queryForObject("""
                WITH dlq_candidates AS MATERIALIZED (
                    SELECT dlq.event_id
                    FROM transactional_outbox_dlq dlq
                    JOIN transactional_outbox outbox ON outbox.event_id = dlq.event_id
                    WHERE dlq.entered_at < ?
                      AND ((outbox.status = 'PUBLISHED' AND outbox.published_at < ?)
                        OR (outbox.status = 'TERMINAL' AND outbox.terminal_at < ?))
                    ORDER BY dlq.event_id
                ), locked_dlq AS MATERIALIZED (
                    SELECT event_id, pg_advisory_xact_lock(hashtextextended(event_id::text, 0))
                    FROM dlq_candidates
                ), deleted_dlq AS (
                    DELETE FROM transactional_outbox_dlq
                    USING locked_dlq
                    WHERE transactional_outbox_dlq.event_id = locked_dlq.event_id
                      AND entered_at < ?
                      AND EXISTS (
                          SELECT 1
                          FROM transactional_outbox
                          WHERE transactional_outbox.event_id = transactional_outbox_dlq.event_id
                            AND ((status = 'PUBLISHED' AND published_at < ?)
                              OR (status = 'TERMINAL' AND terminal_at < ?))
                      )
                    RETURNING transactional_outbox_dlq.event_id
                ), deleted_outbox AS (
                    DELETE FROM transactional_outbox
                    WHERE (status = 'PUBLISHED' AND published_at < ?)
                       OR (status = 'TERMINAL' AND terminal_at < ?)
                    RETURNING event_id
                )
                SELECT (SELECT COUNT(*) FROM deleted_dlq) + (SELECT COUNT(*) FROM deleted_outbox)
                """, Integer.class,
                Timestamp.from(cutoff), Timestamp.from(cutoff), Timestamp.from(cutoff),
                Timestamp.from(cutoff), Timestamp.from(cutoff), Timestamp.from(cutoff),
                Timestamp.from(cutoff), Timestamp.from(cutoff));
        return deleted == null ? 0 : deleted;
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
