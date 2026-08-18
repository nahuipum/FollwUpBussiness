package com.nahui.followupbussiness.customers.application;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerPortfolioStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerActivityStore;
import com.nahui.followupbussiness.customers.domain.Customer;

import java.time.Instant;
import java.util.List;

/**
 * Read-only customer listing: scope, filters, count, then pagination.
 */
public final class CustomerPortfolioReadService implements CustomerPortfolioReadUseCase {
    private final CustomerPortfolioStore store;
    private final CustomerActivityStore activity;

    public CustomerPortfolioReadService(CustomerPortfolioStore store, CustomerActivityStore activity) {
        this.store = store;
        this.activity = activity;
    }

    @Override
    public Page read(Query query, Scope scope) {
        if (query == null || scope == null || scope.tenantId() == null || query.offset() < 0 || query.limit() < 1 || query.limit() > 200
                || (query.sellerId() != null && !scope.allCurrentPortfolios() && !scope.sellerIds().contains(query.sellerId())))
            throw new CustomerPortfolioReadUseCase.Forbidden();
        if (!scope.allCurrentPortfolios() && scope.sellerIds().isEmpty()) return new Page(List.of(), 0);
        long total = store.count(query, scope);
        return new Page(store.list(query, scope), total);
    }
}
