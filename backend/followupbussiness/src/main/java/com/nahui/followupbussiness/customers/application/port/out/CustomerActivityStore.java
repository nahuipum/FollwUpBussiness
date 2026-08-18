package com.nahui.followupbussiness.customers.application.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Public source contract. Future visits and sales adapters materialize these facts in PostgreSQL. */
public interface CustomerActivityStore {
    Optional<Instant> lastCompletedVisit(UUID tenantId, UUID customerId);
    Optional<Instant> lastConfirmedPurchase(UUID tenantId, UUID customerId);
}
