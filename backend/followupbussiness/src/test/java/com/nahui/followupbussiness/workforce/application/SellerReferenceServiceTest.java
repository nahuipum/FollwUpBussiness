package com.nahui.followupbussiness.workforce.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SellerReferenceServiceTest {
    @Test void inactiveTerritoryDoesNotQualifyAnOtherwiseAssignedActiveSeller() {
        UUID tenant = UUID.randomUUID(), sellerId = UUID.randomUUID(), territoryId = UUID.randomUUID();
        SellerStore store = mock(SellerStore.class);
        Seller seller = new Seller(sellerId, tenant, UUID.randomUUID(), "Seller", null, null, null, null,
                List.of(territoryId), SellerStatus.ACTIVE, Instant.EPOCH, Instant.EPOCH, 1);
        when(store.find(tenant, sellerId)).thenReturn(Optional.of(seller));
        when(store.activeTerritory(tenant, territoryId)).thenReturn(false);

        assertThat(new SellerReferenceService(store).activeAssignedToTerritory(tenant, sellerId, territoryId)).isFalse();
    }
}
