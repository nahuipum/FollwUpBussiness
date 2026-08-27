package com.nahui.followupbussiness.customers.application.port.in;

import com.nahui.followupbussiness.customers.domain.Customer;

import java.time.LocalDate;
import java.time.Instant;
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

    /** Names for points from a route whose access has already been authorized by Routing. */
    List<RouteCustomerName> routeCustomerNames(UUID tenantId, List<UUID> customerIds);

    /** Route-planning reference resolved at the requested operational date. */
    List<RouteCustomer> activeAssignedToSellerAt(UUID tenantId, UUID sellerId, List<UUID> customerIds, LocalDate operationalDate);

    /** Tenant-scoped, current-portfolio candidates for read-only route suggestions. */
    List<SuggestionCandidate> suggestedForSeller(UUID tenantId, UUID sellerId);

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

    /** Minimal, tenant-scoped planning reference; no personal data is exposed. */
    record RouteCustomer(UUID id, GeoPoint location, UUID territoryId) { }

    record RouteCustomerName(UUID id, String name) { }

    record SuggestionCandidate(Customer customer, Instant lastCompletedVisitAt) { }

    final class Forbidden extends RuntimeException {
    }
}
