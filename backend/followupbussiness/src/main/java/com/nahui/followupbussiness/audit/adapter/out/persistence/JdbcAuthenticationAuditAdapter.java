package com.nahui.followupbussiness.audit.adapter.out.persistence;

import com.nahui.followupbussiness.audit.application.RecordAuthenticationAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuthenticationAuditUseCase;
import java.sql.Timestamp;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/** Audit-owned adapter; it joins the caller transaction through the shared datasource. */
public final class JdbcAuthenticationAuditAdapter implements RecordAuthenticationAuditUseCase {
    private final JdbcTemplate jdbc;
    public JdbcAuthenticationAuditAdapter(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public void record(RecordAuthenticationAuditCommand c) {
        String status = switch (c.result()) { case REFRESHED, LOGGED_OUT -> "SUCCESS"; case REUSED, REJECTED, RATE_LIMITED -> "DENIED"; default -> "ERROR"; };
        String after = "{\"channel\":\"" + c.channel().name() + "\",\"result\":\"" + c.result().name() + "\"" + (c.reason() == null ? "" : ",\"reason\":\"" + c.reason().name() + "\"") + "}";
        jdbc.update("INSERT INTO audit_entry(id,tenant_id,actor_id,action,resource_type,resource_id,result,correlation_id,scope,before_state,after_state,occurred_at) VALUES (?,?,?,?,?,?,?,?,'ANONYMOUS_AUTH','{}'::jsonb,CAST(? AS jsonb),?)",
                UUID.randomUUID(), c.tenantId(), c.accountId(), "AUTHENTICATION", "SESSION_FAMILY", c.sessionFamilyId(), status, c.correlationId(), after, Timestamp.from(c.occurredAt()));
    }
}
