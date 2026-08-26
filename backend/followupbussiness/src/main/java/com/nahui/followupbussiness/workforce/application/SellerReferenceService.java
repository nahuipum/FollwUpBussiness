package com.nahui.followupbussiness.workforce.application;

import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

public final class SellerReferenceService implements SellerReferenceUseCase {
    private final SellerStore sellers;
    public SellerReferenceService(SellerStore sellers) { this.sellers = sellers; }
    @Override public boolean allActive(UUID tenantId, Set<UUID> sellerIds) {
        return tenantId != null && sellerIds != null && !sellerIds.isEmpty()
                && sellerIds.stream().allMatch(id -> id != null && sellers.find(tenantId, id)
                .map(seller -> seller.status() == SellerStatus.ACTIVE).orElse(false));
    }
    @Override public boolean activeAssignedToTerritory(UUID tenantId, UUID sellerId, UUID territoryId) {
        return tenantId != null && sellerId != null && territoryId != null && sellers.find(tenantId, sellerId)
                .map(seller -> seller.status() == SellerStatus.ACTIVE && seller.territoryIds().contains(territoryId)).orElse(false);
    }
    @Override public Set<UUID> activeTerritoriesAssignedTo(UUID tenantId, UUID sellerId) {
        if (tenantId == null || sellerId == null) return Set.of();
        return sellers.find(tenantId, sellerId).filter(seller -> seller.status() == SellerStatus.ACTIVE).stream()
                .flatMap(seller -> seller.territoryIds().stream()).filter(id -> sellers.activeTerritory(tenantId, id))
                .collect(Collectors.toUnmodifiableSet());
    }
    @Override public Set<UUID> activeSellerIdsForUser(UUID tenantId, UUID accountId) { return sellers.activeSellerIdsForUser(tenantId, accountId); }
    @Override public Set<UUID> activeSellerIdsForTenant(UUID tenantId) { return sellers.activeSellerIdsForTenant(tenantId); }
}
