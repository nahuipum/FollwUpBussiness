package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.jdbc.core.JdbcTemplate;

/** Writes the company-user evidence on the same datasource and transaction as the identity mutation. */
public final class JdbcCompanyUserAuditStore implements AuditEntryStore {
    private final JdbcTemplate jdbc;
    public JdbcCompanyUserAuditStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public boolean append(AuditEntry entry) {
        return jdbc.update("""
                INSERT INTO audit_entry (id, tenant_id, actor_id, action, resource_type, resource_id, result, correlation_id, scope, before_state, after_state, occurred_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?)
                """, entry.id(), entry.tenantId(), entry.actorId(), entry.action().name(), entry.resourceType(), entry.resourceId(),
                entry.result().name(), entry.correlationId(), entry.scope(), json(entry.before()), json(entry.after()), Timestamp.from(entry.occurredAt())) == 1;
    }
    @Override public int deleteNetworkContextBefore(Instant before, int batchSize) { throw new UnsupportedOperationException(); }
    @Override public int deleteEntriesBefore(Instant before, int batchSize) { throw new UnsupportedOperationException(); }
    private static String json(java.util.Map<String, String> values) {
        return values.entrySet().stream().map(e -> "\"" + e.getKey() + "\":\"" + e.getValue() + "\"")
                .collect(java.util.stream.Collectors.joining(",", "{", "}"));
    }
}
