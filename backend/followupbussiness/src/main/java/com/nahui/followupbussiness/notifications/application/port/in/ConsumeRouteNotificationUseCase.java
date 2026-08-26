package com.nahui.followupbussiness.notifications.application.port.in;

import java.time.Instant;
import java.util.UUID;

public interface ConsumeRouteNotificationUseCase {
    void consume(Command command);
    record Command(UUID eventId, String eventType, int version, Instant occurredAt, UUID tenantId,
                   UUID correlationId, UUID routeId, long routeVersion, UUID recipientTechnicalId,
                   boolean notifySeller) { }
}
