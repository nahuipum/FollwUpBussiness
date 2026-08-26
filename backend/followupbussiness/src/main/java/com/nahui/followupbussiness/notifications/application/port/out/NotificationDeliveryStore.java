package com.nahui.followupbussiness.notifications.application.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface NotificationDeliveryStore {
    Optional<Installation> findActiveInstallation(UUID tenantId, UUID userId);
    boolean reserve(UUID tenantId, UUID eventId, UUID recipientId, String type, Instant now);
    void retryable(UUID tenantId, UUID eventId, UUID recipientId, String type, Instant now);
    void delivered(UUID tenantId, UUID eventId, UUID recipientId, String type, Instant now);
    void revoke(UUID installationId, Instant now);
    record Installation(UUID id, UUID tenantId, UUID userId, UUID sessionFamilyId, String adapterId, String protectedToken) { }
}
