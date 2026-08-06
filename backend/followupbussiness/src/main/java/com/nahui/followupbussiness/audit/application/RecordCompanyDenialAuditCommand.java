package com.nahui.followupbussiness.audit.application;

import java.util.Objects;
import java.util.UUID;

/** Contains only the server-generated identifier for a denied attempt. */
public record RecordCompanyDenialAuditCommand(UUID attemptId) {
    public RecordCompanyDenialAuditCommand { Objects.requireNonNull(attemptId, "attemptId is required"); }
}
