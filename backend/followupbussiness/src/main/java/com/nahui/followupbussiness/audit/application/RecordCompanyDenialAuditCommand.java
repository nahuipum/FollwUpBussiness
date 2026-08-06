package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.domain.AuditAction;
import java.util.Objects;
import java.util.UUID;

/** Contains only the server-generated identifier for a denied attempt. */
public record RecordCompanyDenialAuditCommand(UUID attemptId, UUID resourceId, AuditAction action) {
    public RecordCompanyDenialAuditCommand {
        Objects.requireNonNull(attemptId, "attemptId is required");
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(action, "action is required");
    }

    public RecordCompanyDenialAuditCommand(UUID attemptId) {
        this(attemptId, attemptId, AuditAction.CRITICAL_MUTATION);
    }
}
