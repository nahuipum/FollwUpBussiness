package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;
import java.util.List;
import java.util.UUID;

public interface ReorderRoutePointsUseCase {
    Route reorder(Command command, AuthenticatedActor actor);
    record Command(UUID routeId, long baseRouteVersion, Long proposalVersion, List<UUID> routePointIds, UUID correlationId) {
        public Command(UUID routeId, long baseRouteVersion, List<UUID> routePointIds, UUID correlationId) {
            this(routeId, baseRouteVersion, null, routePointIds, correlationId);
        }
    }
    final class Forbidden extends RuntimeException { }
    final class Conflict extends RuntimeException {
        public enum Code {
            ROUTE_VERSION_CONFLICT,
            PROPOSAL_VERSION_CONFLICT,
            ROUTE_NOTIFICATION_UNAVAILABLE,
            JOURNEY_STATE_UNAVAILABLE,
            JOURNEY_ALREADY_STARTED,
            SNAPSHOT_MISSING,
            SNAPSHOT_EXPIRED,
            SNAPSHOT_STALE,
            SNAPSHOT_INCOMPLETE
        }
        private final Code code;
        public Conflict() { this(Code.ROUTE_VERSION_CONFLICT); }
        public Conflict(Code code) { super(code.name()); this.code = code; }
        public Code code() { return code; }
    }
    final class Invalid extends RuntimeException {
        public Invalid() { super("INVALID_REORDER_REQUEST"); }
        public Invalid(String code) { super(code); }
    }
}
