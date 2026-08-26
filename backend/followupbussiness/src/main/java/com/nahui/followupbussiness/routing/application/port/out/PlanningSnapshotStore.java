package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.routing.domain.PlanningSnapshot;
import java.util.Optional;
import java.util.UUID;

public interface PlanningSnapshotStore {
    Optional<PlanningSnapshot> findValidForUpdate(UUID tenantId, UUID routeId, long baseRouteVersion);
    void supersedeAndCopy(PlanningSnapshot snapshot, long newRouteVersion);
}
