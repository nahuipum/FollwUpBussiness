package com.nahui.followupbussiness.routing.adapter.out.persistence;

import com.nahui.followupbussiness.routing.application.port.out.RouteProposalRevisionStore;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcRouteProposalRevisionStore implements RouteProposalRevisionStore {
    private final JdbcTemplate jdbc;

    public JdbcRouteProposalRevisionStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean isCurrentProposalForUpdate(UUID tenantId, UUID routeId, long proposalVersion, long baseRouteVersion) {
        jdbc.query("select pg_advisory_xact_lock(hashtext(?))", rs -> { }, tenantId + ":" + routeId);
        Boolean current = jdbc.queryForObject("""
                select exists (
                  select 1 from route_optimization_proposal proposal
                  where proposal.tenant_id=? and proposal.route_id=?
                    and proposal.proposal_version=? and proposal.base_route_version=?
                    and proposal.proposal_version=(
                      select max(candidate.proposal_version) from route_optimization_proposal candidate
                      where candidate.tenant_id=? and candidate.route_id=?
                    )
                )
                """, Boolean.class, tenantId, routeId, proposalVersion, baseRouteVersion, tenantId, routeId);
        return Boolean.TRUE.equals(current);
    }

    @Override
    public void recordManualEdit(UUID tenantId, UUID routeId, long proposalVersion, long baseRouteVersion,
                                 long routeVersion, UUID actorId, List<UUID> routePointIds, Instant createdAt) {
        jdbc.update("""
                insert into route_optimization_revision
                (id, tenant_id, route_id, proposal_version, base_route_version, route_version, origin, actor_id, route_point_ids, created_at)
                values (?, ?, ?, ?, ?, ?, 'MANUAL_EDIT', ?, ?::jsonb, ?)
                """, UUID.randomUUID(), tenantId, routeId, proposalVersion, baseRouteVersion, routeVersion,
                actorId, routePointIds.stream().map(UUID::toString).collect(java.util.stream.Collectors.joining("\",\"", "[\"", "\"]")),
                Timestamp.from(createdAt));
    }
}
