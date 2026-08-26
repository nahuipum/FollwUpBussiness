package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;

import java.time.*;
import java.util.*;

/**
 * Generates a non-published proposal; it never changes route points.
 */
public interface OptimizeRouteUseCase {
    Result optimize(Command command, AuthenticatedActor actor);

    record Command(UUID routeId, LocalDate date, UUID sellerId, UUID territoryId, GeoPoint start, GeoPoint end,
                   Window availability, long baseRouteVersion, List<Visit> visits) {
    }

    record Window(Instant start, Instant end) {
    }

    record Visit(UUID customerId, int serviceDurationSeconds, int priority, List<Window> windows) {
    }

    record Result(UUID routeId, long proposalVersion, long baseRouteVersion, boolean published,
                  List<Planned> orderedVisits,
                  List<Unassigned> unassignedVisits, long totalTravelSeconds, long totalServiceSeconds,
                  long totalDistanceMeters,
                  String optimality, Instant generatedAt) {
    }

    record Planned(UUID customerId, int sequence, Instant plannedArrivalAt, Instant plannedDepartureAt) {
    }

    record Unassigned(UUID customerId, String reason) {
    }

    final class Forbidden extends RuntimeException {
    }

    public final class Conflict extends RuntimeException {
    }

    final class Invalid extends RuntimeException {
    }

    public final class Unavailable extends RuntimeException {
    }

    final class RateLimited extends RuntimeException {
    }
}
