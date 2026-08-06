package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.out.PlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import java.util.UUID;

public final class RecordPlatformCompanyAudit implements RecordPlatformCompanyAuditUseCase {
    private final AuditEntryStore store;
    private final PlatformAuditTrustedContextProvider contextProvider;

    public RecordPlatformCompanyAudit(AuditEntryStore store, PlatformAuditTrustedContextProvider contextProvider) {
        this.store = store;
        this.contextProvider = contextProvider;
    }

    @Override public void record(RecordPlatformCompanyAuditCommand command) {
        PlatformAuditTrustedContext context = contextProvider.current();
        boolean appended = store.append(new AuditEntry(UUID.randomUUID(), null, context.actorId(), command.action(),
                "COMPANY", command.resourceId(), command.result(), context.correlationId(), AuditScope.PLATFORM.name(),
                command.before(), command.after(), command.reason(), context.occurredAt()));
        if (!appended) throw new IllegalStateException("Platform audit evidence was not persisted");
    }
}
