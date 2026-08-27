package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.application.port.out.RouteDirections;
import java.util.List;
import java.util.UUID;

public interface GetRouteDirectionsUseCase {
    RouteDirections.Directions get(UUID routeId, AuthenticatedActor actor);
    RouteDirections.Directions preview(Preview command, AuthenticatedActor actor);
    record Preview(UUID routeId, long baseRouteVersion, List<UUID> routePointIds) { }
    final class Invalid extends RuntimeException { }
    final class Conflict extends RuntimeException { }
    final class Unavailable extends RuntimeException { }
}
