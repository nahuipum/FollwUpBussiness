package com.nahui.followupbussiness.customers.application.port.out;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.Customer;

/**
 * Durable portfolio relation and forward-only transition history owned by customers.
 */
public interface CustomerPortfolioStore {
    List<Assignment> current(UUID tenantId, UUID customerId);

    Map<UUID, List<Assignment>> current(UUID tenantId, List<UUID> customerIds);

    List<HistoryEntry> history(UUID tenantId, UUID customerId);

    void replace(UUID tenantId, UUID customerId, Set<UUID> sellerIds, UUID actorId, LocalDate effectiveFrom, String reason, Instant recordedAt);

    IdempotencyReservation reserveIdempotency(UUID tenantId, UUID key, String fingerprint, Instant recordedAt);

    void completeIdempotency(UUID tenantId, UUID key, List<String> results);

    List<Customer> list(CustomerPortfolioReadUseCase.Query query, CustomerPortfolioReadUseCase.Scope scope);

    long count(CustomerPortfolioReadUseCase.Query query, CustomerPortfolioReadUseCase.Scope scope);

    record Assignment(UUID customerId, UUID sellerId, LocalDate effectiveFrom, UUID actorId, String reason,
                      Instant createdAt) {
    }

    record HistoryEntry(UUID id, UUID customerId, UUID previousSellerId, UUID newSellerId, UUID actorId,
                        LocalDate effectiveFrom, String reason, Instant recordedAt) {
    }

    record IdempotencyRecord(String fingerprint, List<String> results) {
    }

    record IdempotencyReservation(boolean owner, IdempotencyRecord record) {
    }
}
