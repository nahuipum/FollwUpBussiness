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

    Optional<Route> findForUpdate(UUID tenantId, UUID routeId);

    void replacePointsAndVersion(Route route, long expectedVersion);

    Reservation reservePublicationIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);

    void completePublicationIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);

    void publish(Route route, long expectedVersion);

    Reservation reserveReassignmentIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);

    void completeReassignmentIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);

    void reassign(Route route, long expectedVersion);

    record Reservation(boolean owner, UUID routeId, String fingerprint) {
    }
}
