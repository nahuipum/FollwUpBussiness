package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.ResourceAccessGrantQuery;
import com.nahui.followupbussiness.identityaccess.application.port.out.TeamMembershipQuery;
import com.nahui.followupbussiness.identityaccess.application.port.out.AccessDecisionAuditPort;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.Objects;
import java.util.UUID;

/** Object-level policy for modules that own a resource.  Role checks alone are insufficient. */
public final class ResourceAccessAuthorizer {
    private final TeamMembershipQuery teams;
    private final ResourceAccessGrantQuery grants;
    private final AccessDecisionAuditPort audit;

    public ResourceAccessAuthorizer(TeamMembershipQuery teams, ResourceAccessGrantQuery grants, AccessDecisionAuditPort audit) {
        this.teams = teams;
        this.grants = grants;
        this.audit = audit;
    }

    public boolean canAccess(AuthenticatedActor actor, Resource resource, UUID correlationId) {
        Objects.requireNonNull(correlationId, "correlationId is required for an access decision");
        boolean allowed = actor.role() == BaseRole.PLATFORM_SUPERADMIN ||
                (actor.tenantId() != null && actor.tenantId().equals(resource.tenantId()) &&
                (actor.role() == BaseRole.COMPANY_ADMIN ||
                (actor.role() == BaseRole.SELLER && actor.accountId().equals(resource.ownerAccountId())) ||
                (actor.role() == BaseRole.SUPERVISOR
                && teams.isSupervisorOf(actor.accountId(), resource.ownerAccountId(), resource.tenantId()))));
        audit.record(correlationId, actor.accountId(), resource.tenantId(), resource.type(), resource.id(), allowed);
        return allowed;
    }

    public record Resource(UUID tenantId, String type, UUID id, UUID ownerAccountId) {
        public Resource {
            if (tenantId == null || type == null || type.isBlank() || id == null || ownerAccountId == null)
                throw new IllegalArgumentException("A resource authorization target must be complete");
        }
    }
}
