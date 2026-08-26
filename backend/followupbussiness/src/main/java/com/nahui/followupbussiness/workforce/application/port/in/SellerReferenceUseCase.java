package com.nahui.followupbussiness.workforce.application.port.in;

import java.util.Set;
import java.util.UUID;

/** Public workforce boundary for validating active seller references. */
public interface SellerReferenceUseCase {
    boolean allActive(UUID tenantId, Set<UUID> sellerIds);
    default boolean activeAssignedToTerritory(UUID tenantId, UUID sellerId, UUID territoryId) { return false; }
    default Set<UUID> activeTerritoriesAssignedTo(UUID tenantId, UUID sellerId) { return Set.of(); }
    default Set<UUID> activeSellerIdsForUser(UUID tenantId, UUID accountId) { return Set.of(); }
    default Set<UUID> activeSellerIdsForTenant(UUID tenantId) { return Set.of(); }
}
