package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import java.time.Clock;
import java.util.UUID;

public final class RecordAuditEntry implements RecordAuditEntryUseCase {
    private final AuditEntryStore store;
    private final AuditTrustedContextProvider contextProvider;
    private final Clock clock;

    public RecordAuditEntry(AuditEntryStore store, AuditTrustedContextProvider contextProvider, Clock clock) {
        this.store = store;
        this.contextProvider = contextProvider;
        this.clock = clock;
    }

    @Override
    public boolean record(RecordAuditEntryCommand command) {
        AuditTrustedContext context = contextProvider.current();
        AuditEntry entry = new AuditEntry(UUID.randomUUID(), context.tenantId(), context.actorId(), command.action(),
                command.resourceType().name(), command.resourceId(), command.result(), context.correlationId(),
                context.scope().name(), command.before(), command.after(), clock.instant());
        return store.append(entry);
    }
}
