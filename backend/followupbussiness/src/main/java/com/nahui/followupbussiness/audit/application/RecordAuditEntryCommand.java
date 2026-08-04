package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/** Producer input deliberately excludes identity, tenant, correlation, scope and timestamp. */
public record RecordAuditEntryCommand(AuditAction action, AuditResourceType resourceType, UUID resourceId,
                                      AuditResult result, Map<String, String> before, Map<String, String> after) {
    public RecordAuditEntryCommand {
        Objects.requireNonNull(action, "action is required");
        Objects.requireNonNull(resourceType, "resourceType is required");
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(result, "result is required");
        before = before == null ? Map.of() : Map.copyOf(before);
        after = after == null ? Map.of() : Map.copyOf(after);
    }
}
