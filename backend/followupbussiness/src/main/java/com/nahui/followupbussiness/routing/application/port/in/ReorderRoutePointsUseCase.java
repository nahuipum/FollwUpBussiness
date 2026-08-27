package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;
import java.util.List;
import java.util.UUID;

public interface ReorderRoutePointsUseCase {
    Route reorder(Command command, AuthenticatedActor actor);
    record Command(UUID routeId, long baseRouteVersion, List<UUID> routePointIds, UUID correlationId) { }
    final class Forbidden extends RuntimeException { }
    final class Conflict extends RuntimeException { public Conflict() {} public Conflict(String message) { super(message); } }
    final class Invalid extends RuntimeException {
        public Invalid() { super("INVALID_REORDER_REQUEST"); }
        public Invalid(String code) { super(code); }
    }
}
