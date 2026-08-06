package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.out.CompanyDenialAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import java.util.Map;

public final class RecordCompanyDenialAudit implements RecordCompanyDenialAuditUseCase {
    private final AuditEntryStore store;
    private final CompanyDenialAuditTrustedContextProvider contextProvider;

    public RecordCompanyDenialAudit(AuditEntryStore store, CompanyDenialAuditTrustedContextProvider contextProvider) {
        this.store = store;
        this.contextProvider = contextProvider;
    }

    @Override public void record(RecordCompanyDenialAuditCommand command) {
        CompanyDenialAuditTrustedContext context = contextProvider.current();
        store.append(new AuditEntry(command.attemptId(), context.tenantId(), context.actorId(),
                command.action(), "COMPANY", command.resourceId(), AuditResult.DENIED,
                context.correlationId(), AuditScope.TENANT_BOUND_DENIAL.name(), Map.of(), Map.of(), context.occurredAt()));
        // The attempt identifier is server-generated and stable for a retry; the
        // append-only store therefore makes a repeated delivery a no-op.
    }
}
