package com.nahui.followupbussiness.customers.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import com.nahui.followupbussiness.customers.domain.*;
import com.nahui.followupbussiness.identityaccess.domain.model.*;

import java.time.*;
import java.util.*;

import org.junit.jupiter.api.Test;

class UpdateCustomerServiceTest {
    @Test
    void updatesTenantScopedCustomerOptimisticallyAndAuditsOnlyStatus() {
        CustomerStore store = mock(CustomerStore.class);
        TerritoryReferenceUseCase territories = mock(TerritoryReferenceUseCase.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        UUID tenant = UUID.randomUUID(), id = UUID.randomUUID(), territory = UUID.randomUUID();
        when(store.find(tenant, id)).thenReturn(Optional.of(customer(id, tenant, 1)));
        when(territories.activeTerritory(tenant, territory)).thenReturn(true);
        when(store.update(any(), eq(1L))).thenReturn(true);
        when(audit.record(any())).thenReturn(true);
        Customer saved = new UpdateCustomerService(store, territories, audit, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC)).update(id, 1, new UpdateCustomerService.Patch("Renamed", true, null, false, null, false, null, false, null, false, "VIP", true, null, false, new GeoPoint(-11, -76), true, null, false, territory, true, "INACTIVE", true), actor(tenant, BaseRole.COMPANY_ADMIN));
        assertThat(saved.name()).isEqualTo("Renamed");
        assertThat(saved.segment()).isEqualTo("VIP");
        assertThat(saved.location()).isEqualTo(new GeoPoint(-11, -76));
        assertThat(saved.version()).isEqualTo(2);
        verify(audit).record(argThat(a -> a.before().equals(Map.of("status", "ACTIVE")) && a.after().equals(Map.of("status", "INACTIVE"))));
    }

    @Test
    void rejectsUnauthorizedForeignOrStaleWithoutWritesOrAudit() {
        CustomerStore store = mock(CustomerStore.class);
        TerritoryReferenceUseCase territories = mock(TerritoryReferenceUseCase.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        UUID tenant = UUID.randomUUID(), id = UUID.randomUUID();
        var service = new UpdateCustomerService(store, territories, audit, Clock.systemUTC());
        assertThatThrownBy(() -> service.update(id, 1, patch(), actor(tenant, BaseRole.SELLER))).isInstanceOf(UpdateCustomerService.Forbidden.class);
        verifyNoInteractions(store, audit);
        when(store.find(tenant, id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(id, 1, patch(), actor(tenant, BaseRole.COMPANY_ADMIN))).isInstanceOf(UpdateCustomerService.NotFound.class);
        verify(store, never()).update(any(), anyLong());
        verifyNoInteractions(audit);
        when(store.find(tenant, id)).thenReturn(Optional.of(customer(id, tenant, 2)));
        assertThatThrownBy(() -> service.update(id, 1, patch(), actor(tenant, BaseRole.COMPANY_ADMIN))).isInstanceOf(UpdateCustomerService.Conflict.class);
        verify(store, never()).update(any(), anyLong());
        verifyNoInteractions(audit);
    }

    @Test
    void tenantAdminCannotRevealExistingForeignCustomerOrCauseEffects() {
        CustomerStore store = mock(CustomerStore.class);
        TerritoryReferenceUseCase territories = mock(TerritoryReferenceUseCase.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        UUID tenantA = UUID.randomUUID(), tenantB = UUID.randomUUID(), id = UUID.randomUUID();
        var service = new UpdateCustomerService(store, territories, audit, Clock.systemUTC());
        when(store.find(tenantB, id)).thenReturn(Optional.of(customer(id, tenantB, 1)));
        assertThatThrownBy(() -> service.update(id, 1, patch(), actor(tenantA, BaseRole.COMPANY_ADMIN))).isInstanceOf(UpdateCustomerService.NotFound.class);
        verify(store).find(tenantA, id);
        verify(store, never()).find(tenantB, id);
        verify(store, never()).update(any(), anyLong());
        verifyNoInteractions(audit);
    }

    @Test
    void ownerSupervisorIsRejectedBeforeStoreAndAudit() {
        CustomerStore store = mock(CustomerStore.class);
        TerritoryReferenceUseCase territories = mock(TerritoryReferenceUseCase.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        var service = new UpdateCustomerService(store, territories, audit, Clock.systemUTC());
        assertThatThrownBy(() -> service.update(UUID.randomUUID(), 1, patch(), actor(UUID.randomUUID(), BaseRole.SUPERVISOR))).isInstanceOf(UpdateCustomerService.Forbidden.class);
        verifyNoInteractions(store, audit);
    }

    private static UpdateCustomerService.Patch patch() {
        return new UpdateCustomerService.Patch("New", true, null, false, null, false, null, false, null, false, null, false, null, false, null, false, null, false, null, false, "ACTIVE", false);
    }

    private static Customer customer(UUID id, UUID tenant, long v) {
        return new Customer(id, tenant, "Old", null, null, null, null, "STANDARD", "Address", new GeoPoint(-12, -77), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, v);
    }

    private static AuthenticatedActor actor(UUID t, BaseRole r) {
        return new AuthenticatedActor(UUID.randomUUID(), t, r);
    }
}
