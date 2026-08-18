package com.nahui.followupbussiness.workforce.application;

import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;
import java.util.Set;
import java.util.UUID;

public final class SellerReferenceService implements SellerReferenceUseCase {
    private final SellerStore sellers;
    public SellerReferenceService(SellerStore sellers) { this.sellers = sellers; }
    @Override public boolean allActive(UUID tenantId, Set<UUID> sellerIds) {
        return tenantId != null && sellerIds != null && !sellerIds.isEmpty()
                && sellerIds.stream().allMatch(id -> id != null && sellers.find(tenantId, id)
                .map(seller -> seller.status() == TerritoryStatus.ACTIVE).orElse(false));
    }
}
