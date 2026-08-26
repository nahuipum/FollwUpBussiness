package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;
import java.util.List;
import java.util.UUID;

public interface ReorderRoutePointsUseCase {
    Route reorder(Command command, AuthenticatedActor actor);
    record Command(UUID routeId, long baseRouteVersion, List<UUID> routePointIds) { }
    final class Forbidden extends RuntimeException { }
    final class Conflict extends RuntimeException { public Conflict() {} public Conflict(String message) { super(message); } }
    final class Invalid extends RuntimeException { }
}
