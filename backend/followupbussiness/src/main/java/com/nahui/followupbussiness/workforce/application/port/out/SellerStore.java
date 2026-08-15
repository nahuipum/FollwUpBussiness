package com.nahui.followupbussiness.workforce.application.port.out;

import com.nahui.followupbussiness.workforce.domain.Seller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SellerStore {
    boolean activeSupervisor(UUID tenantId, UUID accountId);

    boolean activeTerritory(UUID tenantId, UUID territoryId);

    Seller insert(Seller seller);

    Optional<Seller> find(UUID tenantId, UUID sellerId);

    List<Seller> list(UUID tenantId, UUID supervisorId, com.nahui.followupbussiness.workforce.domain.TerritoryStatus status,
                      UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit);

    long count(UUID tenantId, UUID supervisorId, com.nahui.followupbussiness.workforce.domain.TerritoryStatus status,
               UUID requestedSupervisorId, UUID territoryId, String search);
}
