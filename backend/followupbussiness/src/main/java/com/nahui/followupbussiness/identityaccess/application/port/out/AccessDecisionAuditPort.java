package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.util.UUID;

/** Stores only technical identifiers for an authorization decision. */
public interface AccessDecisionAuditPort {
    void record(UUID correlationId, UUID actorId, UUID tenantId, String resourceType, UUID resourceId, boolean allowed);
}
