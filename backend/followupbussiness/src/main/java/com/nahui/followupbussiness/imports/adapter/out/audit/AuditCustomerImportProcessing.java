package com.nahui.followupbussiness.imports.adapter.out.audit;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportProcessingAudit;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;

public final class AuditCustomerImportProcessing implements CustomerImportProcessingAudit {
    private final AuditEntryStore store;
    private final Clock clock;

    public AuditCustomerImportProcessing(AuditEntryStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    @Override
    public void record(UUID tenantId, UUID actorId, UUID importId, UUID correlationId, String status) {
        AuditResult result = "FAILED".equals(status) ? AuditResult.ERROR : AuditResult.SUCCESS;
        UUID id = UUID.nameUUIDFromBytes((importId + ":" + status).getBytes(StandardCharsets.UTF_8));
        store.append(new AuditEntry(id, tenantId, actorId, AuditAction.CRITICAL_MUTATION, AuditResourceType.CUSTOMER_IMPORT.name(), importId, result, correlationId, AuditScope.AUTHORIZED_RESOURCE.name(), Map.of(), Map.of("status", status), clock.instant()));
    }
}
