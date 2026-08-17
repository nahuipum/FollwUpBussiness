package com.nahui.followupbussiness.customers.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CreateCustomerServiceTest {
    @Test void createsForCompanyAdminAndAuditsOnlySafeMetadata() {
        CustomerStore store = mock(CustomerStore.class); RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        when(store.activeTerritory(any(), any())).thenReturn(true); when(store.insert(any())).thenAnswer(x -> x.getArgument(0)); when(audit.record(any())).thenReturn(true);
        UUID tenant = UUID.randomUUID(); UUID territory = UUID.randomUUID();
        var service = new CreateCustomerService(store, audit, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
        var saved = service.create(command(territory), actor(tenant, BaseRole.COMPANY_ADMIN));
        assertThat(saved.tenantId()).isEqualTo(tenant); assertThat(saved.location()).isEqualTo(new GeoPoint(-12.1, -77.1));
        verify(store).activeTerritory(tenant, territory); verify(audit).record(argThat(x -> x.before().isEmpty() && x.after().equals(java.util.Map.of("status", "ACTIVE"))));
    }
    @Test void rejectsUnauthorizedOrForeignInactiveTerritoryWithoutWritesOrAudit() {
        CustomerStore store = mock(CustomerStore.class); RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        var service = new CreateCustomerService(store, audit, Clock.systemUTC());
        assertThatThrownBy(() -> service.create(command(UUID.randomUUID()), actor(UUID.randomUUID(), BaseRole.SELLER))).isInstanceOf(CreateCustomerService.Forbidden.class);
        verifyNoInteractions(store, audit);
        when(store.activeTerritory(any(), any())).thenReturn(false);
        assertThatThrownBy(() -> service.create(command(UUID.randomUUID()), actor(UUID.randomUUID(), BaseRole.COMPANY_ADMIN))).isInstanceOf(CreateCustomerService.InvalidTerritory.class);
        verify(store, never()).insert(any()); verifyNoInteractions(audit);
    }
    private static CreateCustomerService.Command command(UUID territory) { return new CreateCustomerService.Command("Customer", null, null, null, null, "Address", new GeoPoint(-12.1, -77.1), null, territory); }
    private static AuthenticatedActor actor(UUID tenant, BaseRole role) { return new AuthenticatedActor(UUID.randomUUID(), tenant, role); }
}
