package com.nahui.followupbussiness.customers.application.port.out;

import com.nahui.followupbussiness.customers.domain.Customer;
import java.util.UUID;
import java.util.Optional;

public interface CustomerStore {
    boolean activeTerritory(UUID tenantId, UUID territoryId);
    Customer insert(Customer customer);
    Optional<Customer> find(UUID tenantId, UUID customerId);
    boolean update(Customer customer, long expectedVersion);
}
