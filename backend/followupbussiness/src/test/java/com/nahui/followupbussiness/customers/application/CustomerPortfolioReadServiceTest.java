package com.nahui.followupbussiness.customers.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerActivityStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerPortfolioStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class CustomerPortfolioReadServiceTest {
    @Test
    void readsCurrentPortfoliosForThePageInOneBatch() {
        CustomerPortfolioStore store = mock(CustomerPortfolioStore.class);
        UUID tenant = UUID.randomUUID(), firstId = UUID.randomUUID(), secondId = UUID.randomUUID();
        UUID firstSeller = UUID.randomUUID(), secondSeller = UUID.randomUUID();
        Customer first = customer(firstId, tenant, "Alpha");
        Customer second = customer(secondId, tenant, "Bravo");
        var query = new CustomerPortfolioReadUseCase.Query(null, null, null, null, null, null, null, 0, 20);
        var scope = new CustomerPortfolioReadUseCase.Scope(tenant, true, Set.of());
        when(store.count(query, scope)).thenReturn(2L);
        when(store.list(query, scope)).thenReturn(List.of(first, second));
        when(store.current(tenant, List.of(firstId, secondId))).thenReturn(Map.of(
                firstId, List.of(assignment(firstId, firstSeller)),
                secondId, List.of(assignment(secondId, secondSeller))));

        var page = new CustomerPortfolioReadService(store, mock(CustomerActivityStore.class), mock(CustomerStore.class)).read(query, scope);

        assertThat(page.items()).extracting(detail -> detail.assignedSellerIds()).containsExactly(List.of(firstSeller), List.of(secondSeller));
        verify(store).current(tenant, List.of(firstId, secondId));
        verify(store, never()).current(tenant, firstId);
        verify(store, never()).current(tenant, secondId);
    }

    @Test
    void hidesCustomerWhenPortfolioIsRevokedWhileDetailIsBeingRead() {
        CustomerPortfolioStore store = mock(CustomerPortfolioStore.class);
        CustomerStore customers = mock(CustomerStore.class);
        UUID tenant = UUID.randomUUID(), customerId = UUID.randomUUID(), requestedSeller = UUID.randomUUID(), replacementSeller = UUID.randomUUID();
        Customer customer = customer(customerId, tenant, "Customer");
        var scope = new CustomerPortfolioReadUseCase.Scope(tenant, false, Set.of(requestedSeller));
        when(customers.find(tenant, customerId)).thenReturn(Optional.of(customer));
        when(store.current(tenant, customerId)).thenReturn(List.of(new CustomerPortfolioStore.Assignment(customerId, replacementSeller, LocalDate.of(2026, 1, 1), UUID.randomUUID(), null, Instant.EPOCH)));

        var service = new CustomerPortfolioReadService(store, mock(CustomerActivityStore.class), customers);

        assertThat(service.get(customerId, scope)).isEmpty();
    }

    private Customer customer(UUID id, UUID tenant, String name) {
        return new Customer(id, tenant, name, null, null, null, null, null, "Address", new GeoPoint(-12.1, -77.1), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, 1);
    }

    private CustomerPortfolioStore.Assignment assignment(UUID customerId, UUID sellerId) {
        return new CustomerPortfolioStore.Assignment(customerId, sellerId, LocalDate.of(2026, 1, 1), UUID.randomUUID(), null, Instant.EPOCH);
    }
}
