package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.CopyRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.PlanningSnapshotStore;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.application.port.out.TravelMatrix;
import com.nahui.followupbussiness.routing.domain.PlanningSnapshot;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public final class CopyRouteService implements CopyRouteUseCase {
    private final RouteStore routes;
    private final PlanningSnapshotStore snapshots;
    private final TravelMatrix matrix;
    private final CurrentCompanyQuery companies;
    private final CustomerPortfolioReadUseCase customers;
    private final SellerReferenceUseCase sellers;
    private final TerritoryReferenceUseCase territories;
    private final PortfolioAccessScopeUseCase scopes;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;

    public CopyRouteService(RouteStore routes, PlanningSnapshotStore snapshots, TravelMatrix matrix, CurrentCompanyQuery companies,
                            CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers,
                            TerritoryReferenceUseCase territories, PortfolioAccessScopeUseCase scopes,
                            RecordAuditEntryUseCase audit, Clock clock) {
        this.routes = routes; this.snapshots = snapshots; this.matrix = matrix; this.companies = companies;
        this.customers = customers; this.sellers = sellers; this.territories = territories;
        this.scopes = scopes; this.audit = audit; this.clock = clock;
    }

    @Override public Result copy(Command command, AuthenticatedActor actor) {
        validate(command, actor);
        Route source = routes.find(actor.tenantId(), command.sourceRouteId()).orElseThrow(Forbidden::new);
        authorize(actor, source, command.sellerId());
        if (command.date().equals(source.date())) throw new Invalid();
        if (!sellers.allActive(actor.tenantId(), Set.of(command.sellerId()))) throw new Forbidden();
        String fingerprint = fingerprint(command);
        var reservation = routes.reserveCopyIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), fingerprint, clock.instant());
        if (!reservation.owner()) {
            if (!fingerprint.equals(reservation.fingerprint())) throw new Conflict();
            Route copied = routes.find(actor.tenantId(), reservation.routeId()).orElseThrow(Conflict::new);
            return new Result(copied, List.of());
        }
        List<Warning> warnings = new ArrayList<>();
        if (!sellers.allActive(actor.tenantId(), Set.of(source.sellerId())))
            warnings.add(new Warning("SOURCE_SELLER_INACTIVE", "SELLER", null));
        Map<UUID, CustomerPortfolioReadUseCase.RouteCustomer> eligible = eligible(command, source, actor);
        CopiedPoints copiedPoints = copyEligiblePoints(source, eligible, actor, warnings);
        var now = clock.instant();
        Route copied = new Route(UUID.randomUUID(), actor.tenantId(), command.name() == null ? source.name() : command.name(),
                command.date(), command.sellerId(), source.startLocation(), copiedPoints.points(), now, now, 1, "DRAFT");
        routes.save(copied);
        captureOrMarkIncomplete(source, copied, copiedPoints.sourcePointByTargetPoint());
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.ROUTE, copied.id(), AuditResult.SUCCESS, Map.of(), Map.of("status", "DRAFT"))))
            throw new IllegalStateException("audit persistence failed");
        routes.completeCopyIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), copied.id());
        return new Result(copied, List.copyOf(warnings));
    }

    private Map<UUID, CustomerPortfolioReadUseCase.RouteCustomer> eligible(Command command, Route source, AuthenticatedActor actor) {
        List<UUID> customerIds = source.points().stream().map(Route.Point::customerId).toList();
        Map<UUID, CustomerPortfolioReadUseCase.RouteCustomer> result = new HashMap<>();
        customers.activeAssignedToSellerAt(actor.tenantId(), command.sellerId(), customerIds, command.date()).forEach(customer -> result.put(customer.id(), customer));
        return result;
    }

    private CopiedPoints copyEligiblePoints(Route source, Map<UUID, CustomerPortfolioReadUseCase.RouteCustomer> eligible,
                                            AuthenticatedActor actor, List<Warning> warnings) {
        List<Route.Point> copied = new ArrayList<>();
        Map<UUID, UUID> sourcePointByTargetPoint = new HashMap<>();
        for (Route.Point point : source.points()) {
            var detail = customers.get(point.customerId(), new CustomerPortfolioReadUseCase.Scope(actor.tenantId(), true, Set.of()));
            if (detail.isEmpty() || !"ACTIVE".equals(detail.get().customer().status())) {
                warnings.add(new Warning("CUSTOMER_INACTIVE", "CUSTOMER", point.id())); continue;
            }
            var reference = eligible.get(point.customerId());
            if (reference == null) { warnings.add(new Warning("CUSTOMER_OUTSIDE_TARGET_PORTFOLIO", "CUSTOMER", point.id())); continue; }
            if (!territories.activeTerritory(actor.tenantId(), reference.territoryId())) {
                warnings.add(new Warning("TERRITORY_NOT_EFFECTIVE", "TERRITORY", point.id())); continue;
            }
            Route.Point target = new Route.Point(UUID.randomUUID(), reference.id(), copied.size() + 1, reference.location());
            copied.add(target);
            sourcePointByTargetPoint.put(target.id(), point.id());
        }
        return new CopiedPoints(List.copyOf(copied), Map.copyOf(sourcePointByTargetPoint));
    }

    private void captureOrMarkIncomplete(Route source, Route copied, Map<UUID, UUID> sourcePointByTargetPoint) {
        Instant fallback = clock.instant();
        try {
            if (copied.points().isEmpty()) throw new IllegalStateException("copied route has no visits");
            PlanningSnapshot sourceSnapshot = snapshots.findLatestReusable(source.tenantId(), source.id())
                    .orElseThrow(() -> new IllegalStateException("source planning snapshot unavailable"));
            Map<UUID, PlanningSnapshot.Visit> sourceVisits = new HashMap<>();
            sourceSnapshot.visits().forEach(visit -> sourceVisits.put(visit.pointId(), visit));
            var company = companies.findById(copied.tenantId()).orElseThrow();
            if (company.settings().planningDayStart() == null || company.settings().planningDayEnd() == null)
                throw new IllegalStateException("planning window unavailable");
            ZoneId zone = ZoneId.of(company.settings().timezone());
            Instant start = copied.date().atTime(company.settings().planningDayStart()).atZone(zone).toInstant();
            Instant end = copied.date().atTime(company.settings().planningDayEnd()).atZone(zone).toInstant();
            Instant validUntil = copied.date().plusDays(1).atStartOfDay(zone).toInstant();
            Map<String, PlanningSnapshot.Leg> legs = completeLegs(captureCompleteMatrix(copied.points()), copied.points());
            if (companies.findById(copied.tenantId()).map(current -> current.version() == company.version()).orElse(false) == false)
                throw new IllegalStateException("planning settings changed");
            List<PlanningSnapshot.Visit> visits = copied.points().stream().map(point -> {
                UUID sourcePointId = sourcePointByTargetPoint.get(point.id());
                PlanningSnapshot.Visit sourceVisit = sourceVisits.get(sourcePointId);
                if (sourceVisit == null) throw new IllegalStateException("source visit unavailable");
                return new PlanningSnapshot.Visit(point.id(), sourceVisit.serviceSeconds(), start, end);
            }).toList();
            snapshots.saveValid(new PlanningSnapshot(UUID.randomUUID(), copied.tenantId(), copied.id(), copied.version(),
                    validUntil, start, end, visits, legs));
        } catch (RuntimeException exception) {
            snapshots.saveIncomplete(copied.tenantId(), copied.id(), copied.version(), fallback);
        }
    }

    private TravelMatrix.Matrix captureCompleteMatrix(List<Route.Point> points) {
        int size = points.size();
        int blockSize = size % 5 == 1 ? 4 : 5;
        long[][] seconds = new long[size][size];
        long[][] meters = new long[size][size];
        if (size == 1) return new TravelMatrix.Matrix(seconds, meters);
        List<com.nahui.followupbussiness.customers.domain.GeoPoint> coordinates = points.stream().map(Route.Point::location).toList();
        for (int fromBlock = 0; fromBlock < size; fromBlock += blockSize) {
            int fromEnd = Math.min(size, fromBlock + blockSize);
            for (int toBlock = fromBlock; toBlock < size; toBlock += blockSize) {
                int toEnd = Math.min(size, toBlock + blockSize);
                List<com.nahui.followupbussiness.customers.domain.GeoPoint> request = new ArrayList<>(coordinates.subList(fromBlock, fromEnd));
                if (toBlock != fromBlock) request.addAll(coordinates.subList(toBlock, toEnd));
                TravelMatrix.Matrix part = matrix.calculate(List.copyOf(request));
                validateMatrix(part, request.size());
                for (int from = fromBlock; from < fromEnd; from++)
                    for (int to = toBlock; to < toEnd; to++)
                        if (from != to) {
                            int fromIndex = from - fromBlock;
                            int toIndex = to - toBlock + (toBlock == fromBlock ? 0 : fromEnd - fromBlock);
                            seconds[from][to] = part.seconds()[fromIndex][toIndex];
                            meters[from][to] = part.meters()[fromIndex][toIndex];
                            if (toBlock != fromBlock) {
                                int reverseFrom = to - toBlock + fromEnd - fromBlock;
                                int reverseTo = from - fromBlock;
                                seconds[to][from] = part.seconds()[reverseFrom][reverseTo];
                                meters[to][from] = part.meters()[reverseFrom][reverseTo];
                            }
                        }
            }
        }
        return new TravelMatrix.Matrix(seconds, meters);
    }

    private static void validateMatrix(TravelMatrix.Matrix matrix, int size) {
        if (matrix == null || matrix.seconds() == null || matrix.meters() == null
                || matrix.seconds().length != size || matrix.meters().length != size)
            throw new IllegalArgumentException("incomplete matrix");
        for (int row = 0; row < size; row++) {
            if (matrix.seconds()[row] == null || matrix.meters()[row] == null
                    || matrix.seconds()[row].length != size || matrix.meters()[row].length != size)
                throw new IllegalArgumentException("incomplete matrix");
            for (int column = 0; column < size; column++)
                if (row != column && (matrix.seconds()[row][column] <= 0 || matrix.meters()[row][column] <= 0))
                    throw new IllegalArgumentException("incomplete matrix");
        }
    }

    private static Map<String, PlanningSnapshot.Leg> completeLegs(TravelMatrix.Matrix matrix, List<Route.Point> points) {
        Map<String, PlanningSnapshot.Leg> legs = new HashMap<>();
        for (int from = 0; from < points.size(); from++)
            for (int to = 0; to < points.size(); to++)
                if (from != to) legs.put(points.get(from).id() + ":" + points.get(to).id(),
                        new PlanningSnapshot.Leg(matrix.seconds()[from][to], matrix.meters()[from][to]));
        return legs;
    }

    private void authorize(AuthenticatedActor actor, Route source, UUID targetSellerId) {
        try {
            var scope = scopes.resolve(actor);
            if (!actor.tenantId().equals(source.tenantId()) || (!scope.allCurrentPortfolios() && (!scope.sellerIds().contains(source.sellerId()) || !scope.sellerIds().contains(targetSellerId)))) throw new Forbidden();
        } catch (PortfolioAccessScopeUseCase.Forbidden ex) { throw new Forbidden(); }
    }

    private void validate(Command command, AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.accountId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR)) throw new Forbidden();
        if (command == null || command.sourceRouteId() == null || command.sellerId() == null || command.idempotencyKey() == null
                || command.date() == null || !command.date().isAfter(LocalDate.now(clock)) || (command.name() != null && command.name().length() > 160)) throw new Invalid();
    }

    private static String fingerprint(Command command) {
        try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((command.sourceRouteId() + "|" + command.date() + "|" + command.sellerId() + "|" + (command.name() == null ? "" : command.name())).getBytes(StandardCharsets.UTF_8))); }
        catch (Exception ex) { throw new IllegalStateException(ex); }
    }

    private record CopiedPoints(List<Route.Point> points, Map<UUID, UUID> sourcePointByTargetPoint) { }
}
