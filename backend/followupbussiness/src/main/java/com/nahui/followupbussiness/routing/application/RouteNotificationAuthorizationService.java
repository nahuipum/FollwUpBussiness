package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.routing.application.port.in.RouteNotificationAuthorizationUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import java.util.UUID;

public final class RouteNotificationAuthorizationService implements RouteNotificationAuthorizationUseCase {
    private final RouteStore routes;
    public RouteNotificationAuthorizationService(RouteStore routes) { this.routes = routes; }
    @Override public boolean isAuthorized(UUID tenantId, UUID routeId, long routeVersion, UUID recipientTechnicalId) {
        if (tenantId == null || routeId == null || recipientTechnicalId == null || routeVersion < 1) return false;
        return routes.find(tenantId, routeId).filter(route -> route.tenantId().equals(tenantId)
                && route.sellerId().equals(recipientTechnicalId) && route.version() == routeVersion
                && "PUBLISHED".equals(route.status())).isPresent();
    }
}
