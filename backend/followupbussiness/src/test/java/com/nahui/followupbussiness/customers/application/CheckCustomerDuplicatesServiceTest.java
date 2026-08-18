package com.nahui.followupbussiness.customers.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;

class CheckCustomerDuplicatesServiceTest {
    @Test void scopesQueryToSessionTenantNormalizesAndScoresFiveFields() {
        CustomerStore store = mock(CustomerStore.class); UUID tenant = UUID.randomUUID(); UUID excluded = UUID.randomUUID();
        Customer customer = new Customer(UUID.randomUUID(), tenant, "Name", null, null, null, null, "Address", new GeoPoint(-12.1, -77.1), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, 1);
        when(store.findDuplicateMatches(eq(tenant), any())).thenReturn(List.of(new CustomerStore.DuplicateMatch(customer, Set.of(CustomerStore.MatchedField.NAME, CustomerStore.MatchedField.LOCATION))));
        var result = new CheckCustomerDuplicatesService(store).check(new CheckCustomerDuplicatesService.Command(" Name ", " 12- 3 ", " 9- 8 ", " Address ", new GeoPoint(-12.1, -77.1), excluded), actor(tenant, BaseRole.COMPANY_ADMIN));
        assertThat(result.hasPossibleDuplicates()).isTrue(); assertThat(result.candidates().getFirst().score()).isEqualTo(.4d);
        verify(store).findDuplicateMatches(eq(tenant), argThat(c -> c.name().equals("name") && c.documentNumber().equals("123") && c.phone().equals("98") && c.address().equals("address") && c.excludeCustomerId().equals(excluded)));
    }
    @Test void rejectsAllNonAdminActorsWithoutQueryOrSideEffects() {
        CustomerStore store = mock(CustomerStore.class); var service = new CheckCustomerDuplicatesService(store); var command = new CheckCustomerDuplicatesService.Command("Name", null, null, null, null, UUID.randomUUID());
        assertThatThrownBy(() -> service.check(command, actor(UUID.randomUUID(), BaseRole.SELLER))).isInstanceOf(CheckCustomerDuplicatesService.Forbidden.class);
        assertThatThrownBy(() -> service.check(command, actor(null, BaseRole.PLATFORM_SUPERADMIN))).isInstanceOf(CheckCustomerDuplicatesService.Forbidden.class);
        verifyNoInteractions(store);
    }
    private static AuthenticatedActor actor(UUID tenant, BaseRole role) { return new AuthenticatedActor(UUID.randomUUID(), tenant, role); }
}
