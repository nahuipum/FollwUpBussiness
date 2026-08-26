package com.nahui.followupbussiness.customers.application;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerPortfolioStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerActivityStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Read-only customer listing: scope, filters, count, then pagination.
 */
public final class CustomerPortfolioReadService implements CustomerPortfolioReadUseCase {
    private final CustomerPortfolioStore store;
    private final CustomerActivityStore activity;
    private final CustomerStore customers;

    public CustomerPortfolioReadService(CustomerPortfolioStore store, CustomerActivityStore activity, CustomerStore customers) {
        this.store = store;
        this.activity = activity;
        this.customers = customers;
    }

    @Override
    public Page read(Query query, Scope scope) {
        if (query == null || scope == null || scope.tenantId() == null || query.offset() < 0 || query.limit() < 1 || query.limit() > 200
                || (query.sellerId() != null && !scope.allCurrentPortfolios() && !scope.sellerIds().contains(query.sellerId())))
            throw new CustomerPortfolioReadUseCase.Forbidden();
        if (!scope.allCurrentPortfolios() && scope.sellerIds().isEmpty()) return new Page(List.of(), 0);
        long total = store.count(query, scope);
        List<Customer> listedCustomers = store.list(query, scope);
        Map<UUID, List<CustomerPortfolioStore.Assignment>> assignments = store.current(
                scope.tenantId(), listedCustomers.stream().map(Customer::id).toList());
        return new Page(listedCustomers.stream()
                .map(customer -> new Detail(customer, assignments.getOrDefault(customer.id(), List.of()).stream()
                        .map(CustomerPortfolioStore.Assignment::sellerId).toList()))
                .toList(), total);
    }

    @Override
    public Optional<Detail> get(UUID customerId, Scope scope) {
        if (customerId == null || scope == null || scope.tenantId() == null)
            throw new CustomerPortfolioReadUseCase.Forbidden();
        if (!scope.allCurrentPortfolios() && scope.sellerIds().isEmpty()) return Optional.empty();
        return customers.find(scope.tenantId(), customerId).flatMap(customer -> {
            List<UUID> assignedSellerIds = store.current(scope.tenantId(), customerId).stream().map(CustomerPortfolioStore.Assignment::sellerId).toList();
            if (!scope.allCurrentPortfolios() && assignedSellerIds.stream().noneMatch(scope.sellerIds()::contains))
                return Optional.empty();
            return Optional.of(new Detail(customer, assignedSellerIds));
        });
    }

    @Override
    public List<RouteCustomer> activeAssignedToSellerAt(UUID tenantId, UUID sellerId, List<UUID> customerIds, LocalDate operationalDate) {
        if (tenantId == null || sellerId == null || customerIds == null || customerIds.isEmpty() || operationalDate == null)
            return List.of();
        return store.activeAssignedToSellerAt(tenantId, sellerId, customerIds, operationalDate).stream()
                .map(customer -> new RouteCustomer(customer.id(), customer.location(), customer.territoryId())).toList();
    }

    @Override
    public List<SuggestionCandidate> suggestedForSeller(UUID tenantId, UUID sellerId) {
        if (tenantId == null || sellerId == null) return List.of();
        return store.suggestedForSeller(tenantId, sellerId);
    }
}
