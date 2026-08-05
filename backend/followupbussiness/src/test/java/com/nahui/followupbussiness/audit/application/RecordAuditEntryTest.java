package com.nahui.followupbussiness.audit.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RecordAuditEntryTest {
    @Test void derivesIdentityCorrelationScopeAndTimestampFromTrustedDependencies() {
        UUID tenant = UUID.randomUUID(); UUID actor = UUID.randomUUID(); UUID correlation = UUID.randomUUID();
        CapturingStore store = new CapturingStore();
        var useCase = new RecordAuditEntry(store, () -> new AuditTrustedContext(tenant, actor, correlation, AuditScope.AUTHORIZED_RESOURCE),
                Clock.fixed(Instant.parse("2026-08-04T12:00:00Z"), ZoneOffset.UTC));
        useCase.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.CUSTOMER, UUID.randomUUID(),
                AuditResult.SUCCESS, Map.of("status", "PENDING"), Map.of("status", "APPROVED")));
        assertThat(store.entry.tenantId()).isEqualTo(tenant);
        assertThat(store.entry.actorId()).isEqualTo(actor);
        assertThat(store.entry.correlationId()).isEqualTo(correlation);
        assertThat(store.entry.scope()).isEqualTo("AUTHORIZED_RESOURCE");
        assertThat(store.entry.occurredAt()).isEqualTo(Instant.parse("2026-08-04T12:00:00Z"));
    }

    @Test void rejectsAProducerCommandWithoutAnAllowedResourceVocabulary() {
        assertThatThrownBy(() -> new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, null, UUID.randomUUID(), AuditResult.SUCCESS, Map.of(), Map.of()))
                .isInstanceOf(NullPointerException.class);
    }

    private static final class CapturingStore implements AuditEntryStore {
        AuditEntry entry;
        @Override public boolean append(AuditEntry entry) { this.entry = entry; return true; }
        @Override public int deleteNetworkContextBefore(Instant before, int batchSize) { return 0; }
        @Override public int deleteEntriesBefore(Instant before, int batchSize) { return 0; }
    }
}
