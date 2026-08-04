package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.AccessDecisionAuditPort;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcAccessDecisionAuditAdapter implements AccessDecisionAuditPort {
    private final JdbcTemplate jdbc;
    public JdbcAccessDecisionAuditAdapter(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public void record(UUID correlationId, UUID actorId, UUID tenantId, String type, UUID resourceId, boolean allowed) {
        jdbc.update("INSERT INTO identity_access_access_decision_audit(id,correlation_id,actor_id,tenant_id,resource_type,resource_id,result) VALUES(?,?,?,?,?,?,?)",
                UUID.randomUUID(), correlationId, actorId, tenantId, type, resourceId, allowed ? "ALLOWED" : "DENIED");
    }
}
