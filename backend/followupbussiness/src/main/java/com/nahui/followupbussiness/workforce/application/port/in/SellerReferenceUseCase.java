package com.nahui.followupbussiness.workforce.application.port.in;

import java.util.Set;
import java.util.UUID;

/** Public workforce boundary for validating active seller references. */
public interface SellerReferenceUseCase {
    boolean allActive(UUID tenantId, Set<UUID> sellerIds);
    default boolean activeAssignedToTerritory(UUID tenantId, UUID sellerId, UUID territoryId) { return false; }
}
