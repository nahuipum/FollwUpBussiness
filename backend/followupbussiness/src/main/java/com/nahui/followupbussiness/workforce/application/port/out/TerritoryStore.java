package com.nahui.followupbussiness.workforce.application.port.out;

import com.nahui.followupbussiness.workforce.domain.Territory;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface TerritoryStore {
    Optional<Territory> find(UUID tenantId, UUID id);

    List<Territory> list(UUID tenantId, TerritoryStatus status, String search, int offset, int size);

    long count(UUID tenantId, TerritoryStatus status, String search);

    /**
     * Current seller assignments, grouped for a territory page already scoped to one tenant.
     */
    default Map<UUID, Long> assignedSellerCounts(UUID tenantId, List<UUID> territoryIds) {
        return Map.of();
    }

    boolean existsName(UUID tenantId, String name, UUID excludingId);

    boolean existsCode(UUID tenantId, String code, UUID excludingId);

    Territory insert(Territory territory);

    Optional<Territory> update(Territory territory, long expectedVersion);
}
