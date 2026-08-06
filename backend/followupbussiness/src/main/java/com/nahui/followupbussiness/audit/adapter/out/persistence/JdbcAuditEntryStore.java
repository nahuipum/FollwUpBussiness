package com.nahui.followupbussiness.audit.adapter.out.persistence;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcAuditEntryStore implements AuditEntryStore {
    private final JdbcTemplate writer;
    private final JdbcTemplate purger;

    public JdbcAuditEntryStore(JdbcTemplate writer, JdbcTemplate purger) { this.writer = writer; this.purger = purger; }

    @Override
    public boolean append(AuditEntry entry) {
        if (entry.reason() == null) {
            return writer.update("""
                    INSERT INTO audit_entry (id, tenant_id, actor_id, action, resource_type, resource_id, result, correlation_id, scope, before_state, after_state, occurred_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?)
                    ON CONFLICT DO NOTHING
                    """, entry.id(), entry.tenantId(), entry.actorId(), entry.action().name(), entry.resourceType(), entry.resourceId(),
                    entry.result().name(), entry.correlationId(), entry.scope(), json(entry.before()), json(entry.after()), Timestamp.from(entry.occurredAt())) == 1;
        }
        return writer.update("""
                INSERT INTO audit_entry (id, tenant_id, actor_id, action, resource_type, resource_id, result, correlation_id, scope, before_state, after_state, reason, occurred_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?, ?)
                ON CONFLICT DO NOTHING
                """, entry.id(), entry.tenantId(), entry.actorId(), entry.action().name(), entry.resourceType(), entry.resourceId(),
                entry.result().name(), entry.correlationId(), entry.scope(), json(entry.before()), json(entry.after()), entry.reason(), Timestamp.from(entry.occurredAt())) == 1;
    }

    @Override
    public int deleteNetworkContextBefore(Instant before, int batchSize) {
        return purger.queryForObject("SELECT audit_purge_network_context(?, ?)", Integer.class, Timestamp.from(before), batchSize);
    }

    @Override
    public int deleteEntriesBefore(Instant before, int batchSize) {
        return purger.queryForObject("SELECT audit_purge_entries(?, ?)", Integer.class, Timestamp.from(before), batchSize);
    }

    private static String json(java.util.Map<String, String> values) {
        return values.entrySet().stream().map(entry -> "\"" + entry.getKey() + "\":\"" + entry.getValue() + "\"")
                .collect(java.util.stream.Collectors.joining(",", "{", "}"));
    }
}
