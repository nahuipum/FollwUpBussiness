package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.time.Instant;
import java.util.UUID;

/**
 * Boundary for a durable, privacy-preserving identity notification delivery.
 */
public interface IdentityNotificationPort {
    void enqueue(UUID accountId, UUID tenantId, PasswordRecoveryPort.Purpose purpose, String identifier, String token, Instant expiresAt);
}
