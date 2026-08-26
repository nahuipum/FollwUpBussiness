package com.nahui.followupbussiness.notifications.application;

import com.nahui.followupbussiness.notifications.application.port.in.ConsumeRouteNotificationUseCase;
import com.nahui.followupbussiness.notifications.application.port.out.NotificationDeliveryStore;
import com.nahui.followupbussiness.notifications.application.port.out.RoutePushGateway;
import com.nahui.followupbussiness.routing.application.port.in.RouteNotificationAuthorizationUseCase;

import java.time.Clock;
import java.time.Duration;
import java.util.Set;

public final class ConsumeRouteNotificationService implements ConsumeRouteNotificationUseCase {
    private static final Set<String> TYPES = Set.of("route.published", "route.assigned", "route.modified", "route.reassigned");
    private final NotificationDeliveryStore deliveries;
    private final RouteNotificationAuthorizationUseCase routes;
    private final RoutePushGateway gateway;
    private final Clock clock;
    private final Duration maxFutureSkew;

    public ConsumeRouteNotificationService(NotificationDeliveryStore deliveries, RouteNotificationAuthorizationUseCase routes, RoutePushGateway gateway, Clock clock, Duration maxFutureSkew) {
        this.deliveries = deliveries;
        this.routes = routes;
        this.gateway = gateway;
        this.clock = clock;
        this.maxFutureSkew = maxFutureSkew;
    }

    @Override
    public void consume(Command c) {
        if (!valid(c) || !routes.isAuthorized(c.tenantId(), c.routeId(), c.routeVersion(), c.recipientTechnicalId()))
            return;
        var installation = deliveries.findActiveInstallation(c.tenantId(), c.recipientTechnicalId());
        if (installation.isEmpty() || !c.notifySeller() || !deliveries.reserve(c.tenantId(), c.eventId(), c.recipientTechnicalId(), c.eventType(), clock.instant()))
            return;
        var target = installation.get();
        RoutePushGateway.Result result = gateway.send(new RoutePushGateway.Request(target.id(), target.adapterId(), target.protectedToken(), "Nueva actualización", "Abre la aplicación para ver los cambios."));
        if (result == RoutePushGateway.Result.INVALID_TOKEN) deliveries.revoke(target.id(), clock.instant());
        else if (result == RoutePushGateway.Result.DELIVERED)
            deliveries.delivered(c.tenantId(), c.eventId(), c.recipientTechnicalId(), c.eventType(), clock.instant());
        else if (result == RoutePushGateway.Result.PERMANENT_FAILURE) throw new PermanentPushFailure();
        else {
            deliveries.retryable(c.tenantId(), c.eventId(), c.recipientTechnicalId(), c.eventType(), clock.instant());
            throw new TransientPushFailure();
        }
    }

    private boolean valid(Command c) {
        return c != null && c.eventId() != null && c.tenantId() != null && c.correlationId() != null && c.routeId() != null && c.recipientTechnicalId() != null && c.version() == 1 && TYPES.contains(c.eventType()) && c.occurredAt() != null && !c.occurredAt().isAfter(clock.instant().plus(maxFutureSkew)) && !c.occurredAt().isBefore(clock.instant().minus(Duration.ofHours(24)));
    }

    public static final class TransientPushFailure extends RuntimeException {
    }

    public static final class PermanentPushFailure extends RuntimeException {
    }
}
