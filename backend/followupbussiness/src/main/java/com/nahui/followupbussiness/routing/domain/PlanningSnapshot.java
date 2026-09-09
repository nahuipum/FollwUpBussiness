package com.nahui.followupbussiness.routing.domain;

import java.time.Instant;
import java.util.*;

/** Immutable, tenant-scoped planning input used only to recalculate a route revision. */
public record PlanningSnapshot(UUID id, UUID tenantId, UUID routeId, long baseRouteVersion, Instant validUntil,
                               Instant shiftStart, Instant shiftEnd, List<Visit> visits, Map<String, Leg> legs) {
    public PlanningSnapshot {
        if (id == null || tenantId == null || routeId == null || baseRouteVersion < 1 || validUntil == null
                || shiftStart == null || shiftEnd == null || !shiftStart.isBefore(shiftEnd) || visits == null
                || visits.isEmpty() || visits.size() > 50 || legs == null) throw new IllegalArgumentException("invalid planning snapshot");
        visits = List.copyOf(visits); legs = Map.copyOf(legs);
    }
    public record Visit(UUID pointId, int serviceSeconds, Instant windowStart, Instant windowEnd) {
        public Visit { if (pointId == null || serviceSeconds <= 0 || (windowStart == null) != (windowEnd == null) || (windowStart != null && !windowStart.isBefore(windowEnd))) throw new IllegalArgumentException("invalid snapshot visit"); }
    }
    public record Leg(long seconds, long meters) { public Leg { if (seconds <= 0 || meters <= 0) throw new IllegalArgumentException("invalid snapshot leg"); } }
    public Leg leg(UUID from, UUID to) { var value = legs.get(from + ":" + to); if (value == null) throw new IllegalStateException("incomplete snapshot"); return value; }
}
