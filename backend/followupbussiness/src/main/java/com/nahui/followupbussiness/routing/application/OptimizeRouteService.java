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
        if (actor == null || actor.tenantId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR))
            throw new Forbidden();
        validate(command);
        var scope = scopes.resolve(actor);
        if (!scope.allCurrentPortfolios() && !scope.sellerIds().contains(command.sellerId())) throw new Forbidden();
        Route route = routes.find(actor.tenantId(), command.routeId()).orElseThrow(Forbidden::new);
        if (!"DRAFT".equals(route.status()) || route.version() != command.baseRouteVersion()) throw new Conflict();
        if (!route.sellerId().equals(command.sellerId()) || !route.date().equals(command.date())) throw new Forbidden();
        if (!sellers.activeAssignedToTerritory(actor.tenantId(), command.sellerId(), command.territoryId()))
            throw new Forbidden();
        var refs = customers.activeAssignedToSellerAt(actor.tenantId(), command.sellerId(), command.visits().stream().map(Visit::customerId).toList(), command.date());
        if (refs.size() != command.visits().size() || refs.stream().anyMatch(v -> !command.territoryId().equals(v.territoryId())))
            throw new Forbidden();
        Map<UUID, GeoPoint> locations = new HashMap<>();
        refs.forEach(v -> locations.put(v.id(), v.location()));
        if (locations.size() != command.visits().size() || command.visits().stream().anyMatch(v -> !locations.containsKey(v.customerId())))
            throw new Forbidden();
        var nodes = new ArrayList<GeoPoint>();
        nodes.add(command.start());
        command.visits().forEach(v -> nodes.add(locations.get(v.customerId())));
        nodes.add(command.end());
        if (!quota.reserve(actor.tenantId(), actor.accountId(), command.date())) throw new RateLimited();
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
        proposals.save(actor.tenantId(), command.routeId(), actor.accountId(), command.territoryId(), result, "", "");
        return result;
    }

    private static void validate(Command c) {
        if (c == null || c.routeId() == null || c.date() == null || c.sellerId() == null || c.territoryId() == null || c.start() == null || c.end() == null || !valid(c.availability()) || c.baseRouteVersion() < 1 || c.visits() == null || c.visits().isEmpty() || c.visits().size() > 9)
            throw new Invalid();
        var ids = new HashSet<UUID>();
        for (var v : c.visits())
            if (v == null || v.customerId() == null || !ids.add(v.customerId()) || v.serviceDurationSeconds() <= 0 || v.priority() <= 0 || v.windows() == null || v.windows().stream().anyMatch(w -> !valid(w)))
                throw new Invalid();
    }

    private static boolean valid(Window w) {
        return w != null && w.start() != null && w.end() != null && w.start().isBefore(w.end());
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
