package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminResult;
import com.nahui.followupbussiness.identityaccess.application.port.out.BootstrapAuditPort;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

public final class JdbcBootstrapAuditAdapter implements BootstrapAuditPort {

    private final JdbcTemplate jdbcTemplate;

    public JdbcBootstrapAuditAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void record(
            UUID auditId,
            BootstrapPlatformSuperadminResult.Status result,
            UUID correlationId,
            UUID accountId,
            Instant occurredAt) {
        jdbcTemplate.update(
                """
                INSERT INTO identity_access_bootstrap_audit(
                    id,
                    operation,
                    result,
                    correlation_id,
                    account_id,
                    occurred_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                auditId,
                OPERATION,
                result.name(),
                correlationId,
                accountId,
                Timestamp.from(occurredAt));
    }
}
