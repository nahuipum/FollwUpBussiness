package com.nahui.followupbussiness.identityaccess.application.port.out;

import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminResult;

import java.time.Instant;
import java.util.UUID;

public interface BootstrapAuditPort {

    String OPERATION = "PLATFORM_SUPERADMIN_BOOTSTRAP";

    void record(
            UUID auditId,
            BootstrapPlatformSuperadminResult.Status result,
            UUID correlationId,
            UUID accountId,
            Instant occurredAt);
}
