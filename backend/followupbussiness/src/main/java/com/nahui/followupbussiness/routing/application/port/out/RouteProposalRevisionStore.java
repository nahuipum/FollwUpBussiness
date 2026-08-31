package com.nahui.followupbussiness.routing.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RouteProposalRevisionStore {
    boolean isCurrentProposalForUpdate(UUID tenantId, UUID routeId, long proposalVersion, long baseRouteVersion);

    void recordManualEdit(UUID tenantId, UUID routeId, long proposalVersion, long baseRouteVersion,
                          long routeVersion, UUID actorId, List<UUID> routePointIds, Instant createdAt);
}
