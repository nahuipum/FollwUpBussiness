package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Durable queue boundary. Payload remains confined to identity delivery. */
public interface IdentityNotificationWorkPort {
    List<Work> claimDue(Instant now, int limit);
    void delivered(UUID id, UUID tenantId, Instant now);
    void retry(UUID id, UUID tenantId, Instant nextAttemptAt);
    void erase(UUID id, UUID tenantId, Instant now);
    record Delivery(String identifier, String token) { }
    record Work(UUID id, UUID tenantId, Delivery delivery, Instant expiresAt, int attemptCount) { }
}
