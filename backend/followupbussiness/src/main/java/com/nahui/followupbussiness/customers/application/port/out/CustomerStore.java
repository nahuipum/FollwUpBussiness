package com.nahui.followupbussiness.customers.application.port.out;

import com.nahui.followupbussiness.customers.domain.Customer;
import java.util.UUID;

public interface CustomerStore {
    boolean activeTerritory(UUID tenantId, UUID territoryId);
    Customer insert(Customer customer);
}
