package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.util.UUID;

/** Best-effort defensive telemetry; it never decides whether logout proceeds. */
public interface LogoutAbuseMonitor {
    Decision recordGlobal(UUID accountId, UUID tenantId);
    record Decision(boolean deduplicated, long attemptsInWindow) { }
}
