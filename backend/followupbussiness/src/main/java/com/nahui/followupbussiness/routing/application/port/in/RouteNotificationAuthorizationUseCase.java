package com.nahui.followupbussiness.routing.application.port.in;

import java.util.UUID;

/** Public, read-only boundary used by notifications to revalidate route recipients. */
public interface RouteNotificationAuthorizationUseCase {
    boolean isAuthorized(UUID tenantId, UUID routeId, long routeVersion, UUID recipientTechnicalId);
}
