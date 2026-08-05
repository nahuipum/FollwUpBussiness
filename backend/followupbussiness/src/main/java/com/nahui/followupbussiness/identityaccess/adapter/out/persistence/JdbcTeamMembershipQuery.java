package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.TeamMembershipQuery;

import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcTeamMembershipQuery implements TeamMembershipQuery {
    private final JdbcTemplate jdbc;

    public JdbcTeamMembershipQuery(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean isSupervisorOf(UUID supervisorId, UUID memberId, UUID tenantId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM identity_access_team team
                JOIN identity_access_team_member member ON member.team_id = team.id AND member.tenant_id = team.tenant_id
                WHERE team.supervisor_id = ? AND member.account_id = ? AND team.tenant_id = ?
                """, Integer.class, supervisorId, memberId, tenantId);
        return count != null && count > 0;
    }
}
