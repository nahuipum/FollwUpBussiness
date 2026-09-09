package com.nahui.followupbussiness.routing.application;
import com.nahui.followupbussiness.routing.application.port.in.InvalidatePlanningSnapshotsUseCase;
import com.nahui.followupbussiness.routing.application.port.out.PlanningSnapshotStore;
import java.util.UUID;
public final class InvalidatePlanningSnapshotsService implements InvalidatePlanningSnapshotsUseCase { private final PlanningSnapshotStore snapshots; public InvalidatePlanningSnapshotsService(PlanningSnapshotStore snapshots){this.snapshots=snapshots;} public void invalidateForTenant(UUID tenantId){snapshots.invalidateValidForTenant(tenantId);} }
