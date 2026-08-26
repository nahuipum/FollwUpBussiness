package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.routing.domain.Route;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface RouteStore {
    Reservation reserveIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);

    void save(Route route);

    void completeIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);

    Optional<Route> find(UUID tenantId, UUID routeId);

    Optional<Route> findForUpdate(UUID tenantId, UUID routeId);

    /** Header-only lookup; callers must authorize it before loading route points. */
    Optional<Header> findHeader(UUID tenantId, UUID routeId);

    /** Single-statement authorized detail lookup; points must not be read from a later snapshot. */
    Optional<Route> findAuthorized(UUID tenantId, UUID routeId, Set<UUID> allowedSellerIds, String requiredStatus);

    List<Route> list(UUID tenantId, Set<UUID> allowedSellerIds, LocalDate date, UUID sellerId, String status, int offset, int limit);

    long count(UUID tenantId, Set<UUID> allowedSellerIds, LocalDate date, UUID sellerId, String status);

    List<Route> findPublishedForSellers(UUID tenantId, Set<UUID> sellerIds, LocalDate date);

    void replacePointsAndVersion(Route route, long expectedVersion);

    Reservation reservePublicationIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);

    void completePublicationIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);

    void publish(Route route, long expectedVersion);

    Reservation reserveReassignmentIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);

    void completeReassignmentIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);

    void reassign(Route route, long expectedVersion);

    Reservation reserveCopyIdempotency(UUID tenantId, UUID actorId, UUID key, String fingerprint, Instant recordedAt);

    void completeCopyIdempotency(UUID tenantId, UUID actorId, UUID key, UUID routeId);

    record Reservation(boolean owner, UUID routeId, String fingerprint) {
    }
    record Header(UUID id, UUID tenantId, UUID sellerId, String status) { }

    final class Conflict extends RuntimeException { }
}
