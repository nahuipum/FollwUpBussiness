package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.domain.AuditResult;
import java.util.Objects;
import java.util.UUID;

/** Deliberately excludes caller-supplied identity, tenant, time and HTTP values. */
public record RecordPlatformCompanyAuditCommand(UUID resourceId, AuditResult result) {
    public RecordPlatformCompanyAuditCommand {
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(result, "result is required");
    }
}
