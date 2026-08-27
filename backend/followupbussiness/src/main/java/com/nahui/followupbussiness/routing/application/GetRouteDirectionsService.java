package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteDirections;
import com.nahui.followupbussiness.routing.domain.Route;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/** Authorizes the route before any provider call and keeps only ephemeral versioned results. */
public final class GetRouteDirectionsService implements GetRouteDirectionsUseCase {
    private static final int MAX_CUSTOMERS = 50;
    private final ReadRoutesUseCase routes;
    private final RouteDirections directions;
    private final ConcurrentHashMap<CacheKey, RouteDirections.Directions> cache = new ConcurrentHashMap<>();

    public GetRouteDirectionsService(ReadRoutesUseCase routes, RouteDirections directions) {
        this.routes = routes; this.directions = directions;
    }

    @Override public RouteDirections.Directions get(UUID routeId, AuthenticatedActor actor) {
        Route route = routes.get(routeId, actor);
        List<GeoPoint> coordinates = coordinatesFor(route);
        CacheKey key = new CacheKey(route.id(), route.version());
        return cache.computeIfAbsent(key, ignored -> calculate(route, coordinates));
    }

    /** Calculates a transient road preview for an authorized, complete proposed permutation. */
    @Override public RouteDirections.Directions preview(Preview command, AuthenticatedActor actor) {
        validatePreview(command, actor);
        Route route = routes.get(command.routeId(), actor);
        if (route.version() != command.baseRouteVersion()) throw new Conflict();
        if (!"DRAFT".equals(route.status())) throw new Conflict();
        if (!samePermutation(route.points(), command.routePointIds())) throw new Invalid();
        Map<UUID, Route.Point> points = new HashMap<>();
        route.points().forEach(point -> points.put(point.id(), point));
        List<Route.Point> ordered = command.routePointIds().stream().map(points::get).toList();
        return calculate(route, coordinatesFor(route, ordered));
    }

    /**
     * Routes created from the planning UI do not require a separately configured origin.
     * In that case, the first ordered visit is the origin and the final visit is the destination.
     */
    private List<GeoPoint> coordinatesFor(Route route) {
        if (route.points().isEmpty() || route.points().size() > MAX_CUSTOMERS) throw new Invalid();
        List<Route.Point> points = route.points().stream().sorted(Comparator.comparingInt(Route.Point::sequence)).toList();
        return coordinatesFor(route, points);
    }

    private List<GeoPoint> coordinatesFor(Route route, List<Route.Point> points) {
        if (points.isEmpty() || points.size() > MAX_CUSTOMERS) throw new Invalid();
        if (points.stream().anyMatch(point -> point == null || point.location() == null)) throw new Invalid();
        if (route.startLocation() == null && points.size() < 2) throw new Invalid();

        List<GeoPoint> coordinates = new ArrayList<>(points.size() + (route.startLocation() == null ? 0 : 1));
        if (route.startLocation() != null) coordinates.add(route.startLocation());
        points.forEach(point -> coordinates.add(point.location()));
        return List.copyOf(coordinates);
    }

    private static void validatePreview(Preview command, AuthenticatedActor actor) {
        if (actor == null || actor.accountId() == null || actor.tenantId() == null
                || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR))
            throw new ReadRoutesUseCase.Forbidden();
        if (command == null || command.routeId() == null || command.baseRouteVersion() < 1
                || command.routePointIds() == null || command.routePointIds().isEmpty()
                || command.routePointIds().size() > MAX_CUSTOMERS
                || command.routePointIds().stream().anyMatch(Objects::isNull)
                || new HashSet<>(command.routePointIds()).size() != command.routePointIds().size())
            throw new Invalid();
    }

    private static boolean samePermutation(List<Route.Point> points, List<UUID> ids) {
        return points.size() == ids.size()
                && points.stream().map(Route.Point::id).collect(java.util.stream.Collectors.toSet()).equals(new HashSet<>(ids));
    }

    private RouteDirections.Directions calculate(Route route, List<GeoPoint> coordinates) {
        try {
            cache.keySet().removeIf(key -> key.routeId().equals(route.id()) && key.version() != route.version());
            return directions.calculate(coordinates);
        } catch (RouteDirectionsUnavailable ex) { throw new Unavailable(); }
        catch (RuntimeException ex) { throw ex; }
    }

    public static final class RouteDirectionsUnavailable extends RuntimeException { }
    private record CacheKey(UUID routeId, long version) { }
}
