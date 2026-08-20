package com.nahui.followupbussiness.customers.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
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
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class CustomerPortfolioReadServiceTest {
    @Test
    void hidesCustomerWhenPortfolioIsRevokedWhileDetailIsBeingRead() {
        CustomerPortfolioStore store = mock(CustomerPortfolioStore.class);
        CustomerStore customers = mock(CustomerStore.class);
        UUID tenant = UUID.randomUUID(), customerId = UUID.randomUUID(), requestedSeller = UUID.randomUUID(), replacementSeller = UUID.randomUUID();
        Customer customer = new Customer(customerId, tenant, "Customer", null, null, null, null, null, "Address", new GeoPoint(-12.1, -77.1), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, 1);
        var scope = new CustomerPortfolioReadUseCase.Scope(tenant, false, Set.of(requestedSeller));
        when(customers.find(tenant, customerId)).thenReturn(Optional.of(customer));
        when(store.current(tenant, customerId)).thenReturn(List.of(new CustomerPortfolioStore.Assignment(customerId, replacementSeller, LocalDate.of(2026, 1, 1), UUID.randomUUID(), null, Instant.EPOCH)));

        var service = new CustomerPortfolioReadService(store, mock(CustomerActivityStore.class), customers);

        assertThat(service.get(customerId, scope)).isEmpty();
    }
}
