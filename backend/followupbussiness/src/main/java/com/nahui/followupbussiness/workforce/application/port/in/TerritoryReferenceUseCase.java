package com.nahui.followupbussiness.workforce.application.port.in;

import java.util.UUID;

/** Public workforce reference used by other modules without exposing persistence adapters. */
public interface TerritoryReferenceUseCase {
    boolean activeTerritory(UUID tenantId, UUID territoryId);
}
