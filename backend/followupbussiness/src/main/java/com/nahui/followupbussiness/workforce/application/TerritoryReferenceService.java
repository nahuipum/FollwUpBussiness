package com.nahui.followupbussiness.workforce.application;

import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.out.TerritoryStore;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;
import java.util.UUID;

public final class TerritoryReferenceService implements TerritoryReferenceUseCase {
    private final TerritoryStore territories;

    public TerritoryReferenceService(TerritoryStore territories) { this.territories = territories; }

    @Override public boolean activeTerritory(UUID tenantId, UUID territoryId) {
        return tenantId != null && territoryId != null
                && territories.find(tenantId, territoryId).map(territory -> territory.status() == TerritoryStatus.ACTIVE).orElse(false);
    }
}
