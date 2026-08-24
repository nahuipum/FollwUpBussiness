package com.nahui.followupbussiness.tenancy.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanySettingsUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanySettingsStore;
import com.nahui.followupbussiness.tenancy.domain.model.*;
import io.micrometer.core.instrument.Counter;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CompanySettingsServiceTest {
    private final UUID tenantId = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenantId, BaseRole.COMPANY_ADMIN);
    private final CompanySettingsStore store = mock(CompanySettingsStore.class);
    private final RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
    private final Counter updated = mock(Counter.class), rejected = mock(Counter.class), conflicts = mock(Counter.class);
    private final CompanySettingsService service = new CompanySettingsService(store, audit, updated, rejected, conflicts,
            Clock.fixed(Instant.parse("2026-08-24T00:00:00Z"), ZoneOffset.UTC));

    @Test void fixedTrackingFieldsAreRejectedWithoutWritesOrAudit() {
        when(store.findActiveByTenantId(tenantId)).thenReturn(Optional.of(company(2, settings())));
        assertThatThrownBy(() -> service.update(new CompanySettingsUseCase.Update(null, null, 100, true, null, false, null, false, null, false, 2), admin))
                .isInstanceOf(CompanySettingsService.InvalidUpdateException.class);
        verify(rejected).increment(); verify(store, never()).update(any(), any(), anyLong(), any()); verifyNoInteractions(audit);
    }

    @Test void staleVersionConflictsWithoutOverwriteOrAudit() {
        when(store.findActiveByTenantId(tenantId)).thenReturn(Optional.of(company(2, settings())));
        assertThatThrownBy(() -> service.update(new CompanySettingsUseCase.Update("America/Bogota", null, null, false, null, false, null, false, null, false, 1), admin))
                .isInstanceOf(CompanySettingsService.ConflictException.class);
        verify(conflicts).increment(); verify(store, never()).update(any(), any(), anyLong(), any()); verifyNoInteractions(audit);
    }

    @Test void fixedFieldPrecedesStaleVersionWithoutReadingWritingOrAuditing() {
        assertThatThrownBy(() -> service.update(new CompanySettingsUseCase.Update(null, null, 100, true, null, false, null, false, null, false, 1), admin))
                .isInstanceOf(CompanySettingsService.InvalidUpdateException.class);
        verify(rejected).increment(); verifyNoInteractions(store, audit, conflicts);
    }

    @Test void adminChangesOnlyMutableSettingAndProducesSafeAudit() {
        Company after = company(3, new CompanySettings("America/Bogota", "PEN", 100, 60, 90, null));
        when(store.findActiveByTenantId(tenantId)).thenReturn(Optional.of(company(2, settings())));
        when(store.update(eq(tenantId), any(), eq(2L), any())).thenReturn(Optional.of(after));
        when(audit.record(any())).thenReturn(true);
        assertThat(service.update(new CompanySettingsUseCase.Update("America/Bogota", null, null, false, null, false, null, false, null, false, 2), admin)).isEqualTo(after);
        verify(updated).increment(); verify(audit).record(argThat(command -> command.after().get("operation").equals("COMPANY_SETTINGS_UPDATED")));
    }

    @Test void supervisorCannotReadOrChangeAnotherTenantConfiguration() {
        AuthenticatedActor supervisor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.SUPERVISOR);
        assertThatThrownBy(() -> service.update(new CompanySettingsUseCase.Update("America/Bogota", null, null, false, null, false, null, false, null, false, 1), supervisor))
                .isInstanceOf(CompanySettingsService.AccessDeniedException.class);
        verifyNoInteractions(store, audit);
    }

    @Test void fixedFieldPresentWithNullIsRejectedWithoutEffects() {
        assertThatThrownBy(() -> service.update(new CompanySettingsUseCase.Update("America/Bogota", null, null, true, null, false, null, false, null, false, 2), admin))
                .isInstanceOf(CompanySettingsService.InvalidUpdateException.class);
        verify(rejected).increment(); verifyNoInteractions(store, audit, conflicts);
    }

    @Test void invalidSaleEditWindowIsRejectedBeforeEffects() {
        assertThatThrownBy(() -> service.update(new CompanySettingsUseCase.Update(null, null, null, false, null, false, null, false, 10081, true, 1), admin))
                .isInstanceOf(CompanySettingsService.InvalidUpdateException.class);
        verify(rejected).increment(); verifyNoInteractions(store, audit, conflicts);
    }

    private Company company(long version, CompanySettings settings) {
        return new Company(tenantId, "Nahui SAC", null, "NAHUI", null, CompanyStatus.ACTIVE, settings, Instant.EPOCH, Instant.EPOCH, version);
    }
    private static CompanySettings settings() { return new CompanySettings("America/Lima", "PEN", 100, 60, 90, null); }
}
