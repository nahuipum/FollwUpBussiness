package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.ResourceAccessGrantQuery;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcResourceAccessGrantQuery implements ResourceAccessGrantQuery {
    private final JdbcTemplate jdbc;
    public JdbcResourceAccessGrantQuery(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public boolean hasAccess(UUID accountId, UUID tenantId, String resourceType, UUID resourceId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM identity_access_resource_grant
                WHERE account_id = ? AND tenant_id = ? AND resource_type = ? AND resource_id = ?
                """, Integer.class, accountId, tenantId, resourceType, resourceId);
        return count != null && count > 0;
    }
}
