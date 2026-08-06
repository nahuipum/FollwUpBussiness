package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import java.util.Objects;
import java.util.UUID;

/** Deliberately excludes caller-supplied identity, tenant, time and HTTP values. */
public record RecordPlatformCompanyAuditCommand(UUID resourceId, AuditAction action, AuditResult result) {
    public RecordPlatformCompanyAuditCommand {
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(action, "action is required");
        Objects.requireNonNull(result, "result is required");
    }

    public RecordPlatformCompanyAuditCommand(UUID resourceId, AuditResult result) {
        this(resourceId, AuditAction.CRITICAL_MUTATION, result);
    }
}
