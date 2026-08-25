package com.nahui.followupbussiness.customers.application.port.in;

import com.nahui.followupbussiness.customers.domain.Customer;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import com.nahui.followupbussiness.customers.domain.GeoPoint;

/**
 * Tenant-scoped read contract for BE-016; authorization scope is resolved before filters and pagination.
 */
public interface CustomerPortfolioReadUseCase {
    Page read(Query query, Scope scope);

    Optional<Detail> get(UUID customerId, Scope scope);

    /** Route-planning reference resolved at the requested operational date. */
    List<RouteCustomer> activeAssignedToSellerAt(UUID tenantId, UUID sellerId, List<UUID> customerIds, LocalDate operationalDate);

    /**
     * Resolved from the authenticated actor by workforce before this port is called.
     */
    record Scope(UUID tenantId, boolean allCurrentPortfolios, Set<UUID> sellerIds) {
    }

    record Query(String search, String status, UUID territoryId, UUID sellerId, String segment,
                 LocalDate withoutVisitSince, LocalDate withoutPurchaseSince, int offset, int limit) {
    }

    record Page(List<Detail> items, long total) {
    }

    record Detail(Customer customer, List<UUID> assignedSellerIds) {
    }

    record RouteCustomer(UUID id, GeoPoint location) { }

    final class Forbidden extends RuntimeException {
    }
}
