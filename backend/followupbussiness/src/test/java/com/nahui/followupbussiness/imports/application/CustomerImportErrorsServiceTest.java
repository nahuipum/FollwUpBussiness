package com.nahui.followupbussiness.imports.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.application.port.in.DownloadCustomerImportErrorsUseCase;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import io.micrometer.core.instrument.Counter;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CustomerImportErrorsServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final UUID importId = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
    private final Clock clock = Clock.fixed(Instant.parse("2026-08-24T00:00:00Z"), ZoneOffset.UTC);

    @Test void returnsOnlyRowAndSafeCodesThenAuditsAndCounts() {
        CustomerImportStore store = mock(CustomerImportStore.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        Counter counter = mock(Counter.class);
        when(store.findById(tenant, importId)).thenReturn(Optional.of(job(CustomerImport.Status.COMPLETED_WITH_ERRORS, 2, Instant.parse("2026-08-25T00:00:00Z"))));
        when(store.findRowErrors(tenant, importId)).thenReturn(List.of(new CustomerImportStore.RowError(4, "DUPLICATE"), new CustomerImportStore.RowError(7, "=private@example.com")));
        when(audit.record(any())).thenReturn(true);

        var file = service(store, audit, counter).download(importId, admin);

        assertThat(new String(file.content(), java.nio.charset.StandardCharsets.UTF_8)).isEqualTo("row_number,error_code\r\n4,DUPLICATE\r\n7,INVALID_ROW\r\n").doesNotContain("private@example.com");
        verify(audit).record(argThat(entry -> entry.resourceId().equals(importId) && entry.after().equals(java.util.Map.of("operation", "ERRORS_DOWNLOADED"))));
        verify(counter).increment();
    }

    @Test void hidesOtherTenantAndRejectsNonTerminalOrExpiredWithoutReadingErrors() {
        CustomerImportStore store = mock(CustomerImportStore.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        Counter counter = mock(Counter.class);
        when(store.findById(tenant, importId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service(store, audit, counter).download(importId, admin)).isInstanceOf(DownloadCustomerImportErrorsUseCase.NotFound.class);
        verify(store, never()).findRowErrors(any(), any());

        reset(store);
        when(store.findById(tenant, importId)).thenReturn(Optional.of(job(CustomerImport.Status.PENDING, 1, Instant.parse("2026-08-25T00:00:00Z"))));
        assertThatThrownBy(() -> service(store, audit, counter).download(importId, admin)).isInstanceOf(DownloadCustomerImportErrorsUseCase.NotFound.class);

        reset(store);
        when(store.findById(tenant, importId)).thenReturn(Optional.of(job(CustomerImport.Status.COMPLETED_WITH_ERRORS, 1, Instant.parse("2026-08-24T00:00:00Z"))));
        assertThatThrownBy(() -> service(store, audit, counter).download(importId, admin)).isInstanceOf(DownloadCustomerImportErrorsUseCase.Expired.class);
        verifyNoInteractions(audit, counter);
    }

    @Test void failsBeforeReturningAFileWhenAuditCannotPersist() {
        CustomerImportStore store = mock(CustomerImportStore.class);
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        Counter counter = mock(Counter.class);
        when(store.findById(tenant, importId)).thenReturn(Optional.of(job(CustomerImport.Status.COMPLETED_WITH_ERRORS, 1, Instant.parse("2026-08-25T00:00:00Z"))));
        when(store.findRowErrors(tenant, importId)).thenReturn(List.of(new CustomerImportStore.RowError(4, "DUPLICATE")));
        when(audit.record(any())).thenReturn(false);

        assertThatThrownBy(() -> service(store, audit, counter).download(importId, admin)).isInstanceOf(IllegalStateException.class);
        verify(counter, never()).increment();
    }

    private CustomerImportService service(CustomerImportStore store, RecordAuditEntryUseCase audit, Counter counter) {
        return new CustomerImportService(store, mock(OutboxStore.class), clock, audit, counter);
    }
    private CustomerImport job(CustomerImport.Status status, int rejected, Instant expiresAt) {
        Instant now = Instant.parse("2026-08-20T00:00:00Z");
        return new CustomerImport(importId, tenant, admin.accountId(), UUID.randomUUID(), "key", "source.csv", "text/csv", "1.0", true, "0".repeat(64), status, 0, rejected, now, now, now, expiresAt);
    }
}
