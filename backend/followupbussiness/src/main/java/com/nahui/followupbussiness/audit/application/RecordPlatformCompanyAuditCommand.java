package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import java.util.Objects;
import java.util.Map;
import java.util.UUID;

/** Deliberately excludes caller-supplied identity, tenant, time and HTTP values. */
public record RecordPlatformCompanyAuditCommand(UUID resourceId, AuditAction action, AuditResult result,
        Map<String, String> before, Map<String, String> after, String reason) {
    public RecordPlatformCompanyAuditCommand {
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(action, "action is required");
        Objects.requireNonNull(result, "result is required");
        before = before == null ? Map.of() : Map.copyOf(before);
        after = after == null ? Map.of() : Map.copyOf(after);
    }

    public RecordPlatformCompanyAuditCommand(UUID resourceId, AuditAction action, AuditResult result) {
        this(resourceId, action, result, Map.of(), Map.of(), null);
    }

    public RecordPlatformCompanyAuditCommand(UUID resourceId, AuditResult result) {
        this(resourceId, AuditAction.CRITICAL_MUTATION, result, Map.of(), Map.of(), null);
    }
}
