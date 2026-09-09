package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.routing.domain.PlanningSnapshot;
import java.util.Optional;
import java.util.UUID;

public interface PlanningSnapshotStore {
    Optional<PlanningSnapshot> findValidForUpdate(UUID tenantId, UUID routeId, long baseRouteVersion);
    void saveValid(PlanningSnapshot snapshot);
    void saveIncomplete(UUID tenantId, UUID routeId, long baseRouteVersion, java.time.Instant validUntil);
    void invalidateValidForTenant(UUID tenantId);
    void supersedeAndCopy(PlanningSnapshot snapshot, long newRouteVersion);
}
