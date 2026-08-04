package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResourceAccessAuthorizerTest {
    private final UUID tenant = UUID.randomUUID(), otherTenant = UUID.randomUUID(), supervisor = UUID.randomUUID(), seller = UUID.randomUUID();
    private final UUID correlationId = UUID.randomUUID();
    private final ResourceAccessAuthorizer.Resource resource = new ResourceAccessAuthorizer.Resource(tenant, "CUSTOMER", UUID.randomUUID(), seller);

    @Test void sellerCanOnlyAccessTheirOwnResourceInTheirTenant() {
        var policy = policy(false, false);
        assertThat(policy(false, false).canAccess(new AuthenticatedActor(seller, tenant, BaseRole.SELLER), resource, correlationId)).isTrue();
        assertThat(policy(false, false).canAccess(new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SELLER), resource, correlationId)).isFalse();
        assertThat(policy(false, false).canAccess(new AuthenticatedActor(seller, otherTenant, BaseRole.SELLER), resource, correlationId)).isFalse();
    }

    @Test void supervisorRequiresCurrentPersistedTeamMembershipAndTenantMatch() {
        assertThat(policy(true, false).canAccess(new AuthenticatedActor(supervisor, tenant, BaseRole.SUPERVISOR), resource, correlationId)).isTrue();
        assertThat(policy(false, false).canAccess(new AuthenticatedActor(supervisor, tenant, BaseRole.SUPERVISOR), resource, correlationId)).isFalse();
        assertThat(policy(true, false).canAccess(new AuthenticatedActor(supervisor, otherTenant, BaseRole.SUPERVISOR), resource, correlationId)).isFalse();
    }

    @Test void explicitGrantCannotBroadenSellerOwnershipOrSupervisorTeamScope() {
        assertThat(policy(false, true).canAccess(new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SELLER), resource, correlationId)).isFalse();
        assertThat(policy(false, true).canAccess(new AuthenticatedActor(supervisor, tenant, BaseRole.SUPERVISOR), resource, correlationId)).isFalse();
    }

    @Test void accessDecisionAuditsTheOperationCorrelationIdWithoutCredentialsOrPersonalData() {
        var audit = new CapturingAudit();
        var policy = new ResourceAccessAuthorizer((a, b, c) -> false, (a, b, c, d) -> false, audit);

        policy.canAccess(new AuthenticatedActor(seller, tenant, BaseRole.SELLER), resource, correlationId);

        assertThat(audit.correlationId).isEqualTo(correlationId);
        assertThat(audit.values).containsExactly(correlationId, seller, tenant, "CUSTOMER", resource.id(), true);
    }

    @Test void accessDecisionRequiresTheOperationCorrelationId() {
        assertThatThrownBy(() -> policy(false, false).canAccess(new AuthenticatedActor(seller, tenant, BaseRole.SELLER), resource, null))
                .isInstanceOf(NullPointerException.class)
                .hasMessage("correlationId is required for an access decision");
    }

    private ResourceAccessAuthorizer policy(boolean team, boolean grant) {
        return new ResourceAccessAuthorizer((a, b, c) -> team, (a, b, c, d) -> grant, (a, b, c, d, e, f) -> { });
    }

    private static final class CapturingAudit implements com.nahui.followupbussiness.identityaccess.application.port.out.AccessDecisionAuditPort {
        UUID correlationId;
        java.util.List<Object> values;
        @Override public void record(UUID correlationId, UUID actorId, UUID tenantId, String type, UUID resourceId, boolean allowed) {
            this.correlationId = correlationId;
            this.values = java.util.List.of(correlationId, actorId, tenantId, type, resourceId, allowed);
        }
    }
}
