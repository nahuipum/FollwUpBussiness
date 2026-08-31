package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteProposalStore;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.application.port.out.TravelMatrix;
import com.nahui.followupbussiness.routing.application.port.out.MatrixQuota;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

public final class OptimizeRouteService implements OptimizeRouteUseCase {
    private final RouteStore routes;
    private final RouteProposalStore proposals;
    private final TravelMatrix matrix;
    private final CustomerPortfolioReadUseCase customers;
    private final SellerReferenceUseCase sellers;
    private final PortfolioAccessScopeUseCase scopes;
    private final MatrixQuota quota;
    private final Clock clock;

    public OptimizeRouteService(RouteStore routes, RouteProposalStore proposals, TravelMatrix matrix, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, MatrixQuota quota, Clock clock) {
        this.routes = routes;
        this.proposals = proposals;
        this.matrix = matrix;
        this.customers = customers;
        this.sellers = sellers;
        this.scopes = scopes;
        this.quota = quota;
        this.clock = clock;
    }

    public Result optimize(Command command, AuthenticatedActor actor) {
        if (actor == null || actor.accountId() == null || actor.tenantId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR))
            throw new Forbidden("ACTOR_NOT_AUTHORIZED_FOR_OPTIMIZATION");
        validate(command);
        Route route = routes.find(actor.tenantId(), command.routeId()).orElseThrow(() -> new Forbidden("ROUTE_NOT_FOUND_IN_TENANT"));
        var scope = scopes.resolve(actor);
        if (!scope.allCurrentPortfolios() && !scope.sellerIds().contains(route.sellerId())) throw new Forbidden("ROUTE_OUTSIDE_ACTOR_PORTFOLIO");
        if (!"DRAFT".equals(route.status()) || route.version() != command.baseRouteVersion()) throw new Conflict();
        List<GeoPoint> endpoints = endpoints(route);
        var refs = customers.activeAssignedToSellerAt(actor.tenantId(), route.sellerId(), command.visits().stream().map(Visit::customerId).toList(), route.date());
        if (refs.size() != command.visits().size())
            throw new Forbidden("VISIT_OUTSIDE_ACTIVE_SELLER_PORTFOLIO");
        UUID territoryId = territory(refs);
        if (!sellers.activeTerritory(actor.tenantId(), territoryId))
            throw new Invalid("VISIT_TERRITORY_INACTIVE");
        if (!sellers.activeAssignedToTerritory(actor.tenantId(), route.sellerId(), territoryId))
            throw new Invalid("VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER");
        Map<UUID, GeoPoint> locations = new HashMap<>();
        refs.forEach(v -> locations.put(v.id(), v.location()));
        if (locations.size() != command.visits().size() || command.visits().stream().anyMatch(v -> !locations.containsKey(v.customerId())))
            throw new Forbidden("VISIT_LOCATION_UNAVAILABLE");
        var nodes = new ArrayList<GeoPoint>();
        nodes.add(endpoints.getFirst());
        command.visits().forEach(v -> nodes.add(locations.get(v.customerId())));
        nodes.add(endpoints.getLast());
        if (!quota.reserve(actor.tenantId(), actor.accountId(), route.date())) throw new RateLimited();
        TravelMatrix.Matrix travel = calculate(nodes);
        var ordered = new ArrayList<IndexedVisit>();
        for (int i = 0; i < command.visits().size(); i++) ordered.add(new IndexedVisit(i + 1, command.visits().get(i)));
        ordered.sort(Comparator.comparingInt((IndexedVisit v) -> v.visit().priority()).reversed());
        var planned = new ArrayList<Planned>();
        var unassigned = new ArrayList<Unassigned>();
        Instant at = command.availability().start();
        int from = 0;
        long travelSeconds = 0, serviceSeconds = 0, distanceMeters = 0;
        for (var item : ordered) {
            long arc = arc(travel.seconds(), from, item.node());
            Instant arrival = at.plusSeconds(arc);
            Instant start = windowStart(item.visit(), arrival);
            Instant departure = start == null ? null : start.plusSeconds(item.visit().serviceDurationSeconds());
            if (start == null) {
                unassigned.add(new Unassigned(item.visit().customerId(), "TIME_WINDOW_CONFLICT"));
                continue;
            }
            if (departure.isAfter(command.availability().end())) {
                unassigned.add(new Unassigned(item.visit().customerId(), "OUTSIDE_SHIFT"));
                continue;
            }
            planned.add(new Planned(item.visit().customerId(), planned.size() + 1, start, departure));
            travelSeconds += arc;
            distanceMeters += distance(travel.meters(), from, item.node());
            serviceSeconds += item.visit().serviceDurationSeconds();
            at = departure;
            from = item.node();
        }
        if (!planned.isEmpty()) {
            int endNode = command.visits().size() + 1;
            travelSeconds += arc(travel.seconds(), from, endNode);
            distanceMeters += distance(travel.meters(), from, endNode);
        }
        var result = new Result(command.routeId(), proposals.nextVersion(actor.tenantId(), command.routeId()), command.baseRouteVersion(), false, planned, unassigned, travelSeconds, serviceSeconds, distanceMeters, "FEASIBLE", clock.instant());
        proposals.save(actor.tenantId(), command.routeId(), actor.accountId(), territoryId, result, "", "");
        return result;
    }

    private static void validate(Command c) {
        if (c == null) throw new Invalid("OPTIMIZE_REQUEST_REQUIRED");
        if (c.routeId() == null) throw new Invalid("ROUTE_ID_REQUIRED");
        if (c.baseRouteVersion() < 1) throw new Invalid("ROUTE_VERSION_REQUIRED");
        if (c.visits() == null || c.visits().isEmpty()) throw new Invalid("VISITS_REQUIRED");
        if (c.visits().size() > 9) throw new Invalid("VISIT_LIMIT_EXCEEDED");
        if (!valid(c.availability())) throw new Invalid("AVAILABILITY_END_MUST_BE_AFTER_START");
        var ids = new HashSet<UUID>();
        for (var v : c.visits()) {
            if (v == null) throw new Invalid("VISIT_REQUIRED");
            if (v.customerId() == null) throw new Invalid("VISIT_CUSTOMER_REQUIRED");
            if (!ids.add(v.customerId())) throw new Invalid("DUPLICATE_VISIT_CUSTOMER");
            if (v.serviceDurationSeconds() <= 0) throw new Invalid("VISIT_DURATION_REQUIRED");
            if (v.priority() <= 0) throw new Invalid("VISIT_PRIORITY_REQUIRED");
            if (v.windows() == null) throw new Invalid("VISIT_WINDOWS_REQUIRED");
            if (v.windows().stream().anyMatch(w -> !valid(w))) throw new Invalid("VISIT_WINDOW_END_MUST_BE_AFTER_START");
        }
    }

    private static UUID territory(List<CustomerPortfolioReadUseCase.RouteCustomer> refs) {
        Set<UUID> territoryIds = new HashSet<>();
        for (var ref : refs) {
            if (ref == null || ref.territoryId() == null) throw new Invalid("VISIT_TERRITORY_REQUIRED");
            territoryIds.add(ref.territoryId());
        }
        if (territoryIds.size() != 1) throw new Invalid("MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED");
        return territoryIds.iterator().next();
    }

    private static boolean valid(Window w) {
        return w != null && w.start() != null && w.end() != null && w.start().isBefore(w.end());
    }

    private static List<GeoPoint> endpoints(Route route) {
        if (route.points().isEmpty()) throw new Invalid("ROUTE_ENDPOINT_LOCATION_REQUIRED");
        GeoPoint origin = route.points().getFirst().location();
        GeoPoint destination = route.points().getLast().location();
        if (origin == null || destination == null) throw new Invalid("ROUTE_ENDPOINT_LOCATION_REQUIRED");
        return List.of(origin, destination);
    }

    private TravelMatrix.Matrix calculate(List<GeoPoint> nodes) {
        try {
            var answer = matrix.calculate(nodes);
            if (answer == null || answer.seconds() == null || answer.seconds().length != nodes.size())
                throw new Unavailable();
            for (var row : answer.seconds()) if (row == null || row.length != nodes.size()) throw new Unavailable();
            return answer;
        } catch (Unavailable e) {
            throw e;
        } catch (Exception e) {
            throw new Unavailable();
        }
    }

    private static Instant windowStart(Visit v, Instant arrival) {
        if (v.windows().isEmpty()) return arrival;
        return v.windows().stream().filter(w -> !w.end().isBefore(arrival)).map(w -> arrival.isBefore(w.start()) ? w.start() : arrival).findFirst().orElse(null);
    }

    private static long arc(long[][] m, int from, int to) {
        long value = m[from][to];
        if (value < 0) throw new Unavailable();
        return value;
    }

    private static long distance(long[][] m, int from, int to) {
        return m == null ? 0 : arc(m, from, to);
    }

    private record IndexedVisit(int node, Visit visit) {
    }
}
