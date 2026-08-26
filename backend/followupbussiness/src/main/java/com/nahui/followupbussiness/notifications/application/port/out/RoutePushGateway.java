package com.nahui.followupbussiness.notifications.application.port.out;

import java.util.UUID;

/** Logical provider boundary. Implementations must never log the protected token. */
public interface RoutePushGateway {
    Result send(Request request);
    record Request(UUID installationId, String adapterId, String protectedToken, String title, String body) { }
    enum Result { DELIVERED, INVALID_TOKEN, TRANSIENT_FAILURE, PERMANENT_FAILURE }
}
