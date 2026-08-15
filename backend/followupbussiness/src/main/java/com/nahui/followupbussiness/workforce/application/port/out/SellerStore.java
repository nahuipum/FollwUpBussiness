package com.nahui.followupbussiness.workforce.application.port.out;

import com.nahui.followupbussiness.workforce.domain.Seller;
import java.util.List;
import java.util.UUID;

public interface SellerStore {
    boolean activeSupervisor(UUID tenantId, UUID accountId);
    boolean activeTerritory(UUID tenantId, UUID territoryId);
    Seller insert(Seller seller);
}
