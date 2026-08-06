package com.nahui.followupbussiness.audit.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RecordCompanyDenialAuditTest {
    @Test void recordsOnlyMinimalServerDerivedTenantBoundDenialAndIsIdempotentByAttempt() {
        UUID tenant = UUID.randomUUID(); UUID actor = UUID.randomUUID(); UUID correlation = UUID.randomUUID(); UUID attempt = UUID.randomUUID();
        CapturingStore store = new CapturingStore();
        var useCase = new RecordCompanyDenialAudit(store, () -> new CompanyDenialAuditTrustedContext(tenant, actor, correlation, Instant.EPOCH));
        useCase.record(new RecordCompanyDenialAuditCommand(attempt));
        useCase.record(new RecordCompanyDenialAuditCommand(attempt));
        assertThat(store.entries).hasSize(1);
        AuditEntry entry = store.entries.get(0);
        assertThat(entry.id()).isEqualTo(attempt);
        assertThat(entry.resourceId()).isEqualTo(attempt);
        assertThat(entry.tenantId()).isEqualTo(tenant);
        assertThat(entry.actorId()).isEqualTo(actor);
        assertThat(entry.correlationId()).isEqualTo(correlation);
        assertThat(entry.scope()).isEqualTo("TENANT_BOUND_DENIAL");
        assertThat(entry.before()).isEmpty(); assertThat(entry.after()).isEmpty();
    }

    private static final class CapturingStore implements AuditEntryStore {
        private final List<AuditEntry> entries = new ArrayList<>();
        @Override public boolean append(AuditEntry entry) { if (entries.stream().anyMatch(value -> value.id().equals(entry.id()))) return false; entries.add(entry); return true; }
        @Override public int deleteNetworkContextBefore(Instant before, int batchSize) { return 0; }
        @Override public int deleteEntriesBefore(Instant before, int batchSize) { return 0; }
    }
}
