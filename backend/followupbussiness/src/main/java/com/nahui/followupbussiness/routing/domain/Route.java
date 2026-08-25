package com.nahui.followupbussiness.routing.domain;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Aggregate persisted exclusively by the routing module. */
public record Route(UUID id, UUID tenantId, String name, LocalDate date, UUID sellerId, GeoPoint startLocation,
                    List<Point> points, Instant createdAt, Instant updatedAt, long version) {
    public Route {
        if (id == null || tenantId == null || date == null || sellerId == null || points == null || points.isEmpty()
                || points.size() > 500 || createdAt == null || updatedAt == null || version < 1)
            throw new IllegalArgumentException("invalid route");
        name = name == null || name.isBlank() ? null : name.trim();
        if (name != null && name.length() > 160) throw new IllegalArgumentException("invalid route name");
        points = List.copyOf(points);
        for (int index = 0; index < points.size(); index++) if (points.get(index).sequence() != index + 1) throw new IllegalArgumentException("invalid point sequence");
    }

    public record Point(UUID id, UUID customerId, int sequence, GeoPoint location) {
        public Point { if (id == null || customerId == null || sequence < 1 || location == null) throw new IllegalArgumentException("invalid route point"); }
    }
}
