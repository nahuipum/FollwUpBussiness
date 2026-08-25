package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.routing.domain.Route;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RouteStore {
    Reservation reserveIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);
    void save(Route route);
    void completeIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);
    Optional<Route> find(UUID tenantId, UUID routeId);
    record Reservation(boolean owner, UUID routeId, String fingerprint) { }
}
