package com.nahui.followupbussiness.routing.application.port.in;
import java.util.UUID;
public interface InvalidatePlanningSnapshotsUseCase { void invalidateForTenant(UUID tenantId); }
