package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.*;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.application.port.out.*;
import com.nahui.followupbussiness.routing.domain.*;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;

import java.time.*;
import java.util.*;

import org.springframework.transaction.annotation.*;

public class ReorderRoutePointsService implements ReorderRoutePointsUseCase {
    private final RouteStore routes;
    private final PlanningSnapshotStore snapshots;
    private final PortfolioAccessScopeUseCase scopes;
    private final RecordAuditEntryUseCase audit;
    private final JourneyStartedStatusUseCase journeys;
    private final OutboxStore outbox;
    private final Clock clock;

    public ReorderRoutePointsService(RouteStore routes, PlanningSnapshotStore snapshots, PortfolioAccessScopeUseCase scopes,
                                    RecordAuditEntryUseCase audit, JourneyStartedStatusUseCase journeys, OutboxStore outbox, Clock clock) {
        this.routes = routes;
        this.snapshots = snapshots;
        this.scopes = scopes;
        this.audit = audit;
        this.journeys = journeys;
        this.outbox = outbox;
        this.clock = clock;
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Route reorder(Command command, AuthenticatedActor actor) {
        validate(command, actor);
        Route route = routes.findForUpdate(actor.tenantId(), command.routeId()).orElseThrow(Forbidden::new);
        authorize(actor, route);
        boolean published = "PUBLISHED".equals(route.status());
        if ((!"DRAFT".equals(route.status()) && !published) || route.version() != command.baseRouteVersion())
            throw new Conflict("ROUTE_VERSION_CONFLICT");
        if (published) {
            if (outbox == null) throw new Conflict("ROUTE_NOTIFICATION_UNAVAILABLE");
            JourneyStartedStatusUseCase.State journeyState;
            try {
                journeyState = journeys.stateForUpdate(new JourneyStartedStatusUseCase.Query(actor.tenantId(), route.sellerId(), route.date()));
            } catch (JourneyStartedStatusUseCase.Unavailable exception) {
                throw new Conflict("JOURNEY_STATE_UNAVAILABLE");
            }
            if (journeyState != JourneyStartedStatusUseCase.State.NOT_STARTED) {
                throw new Conflict("JOURNEY_ALREADY_STARTED");
            }
        }
        if (!samePermutation(route.points(), command.routePointIds())) throw new Invalid("ROUTE_POINT_IDS_MISMATCH");
        PlanningSnapshot snapshot = snapshots.findValidForUpdate(actor.tenantId(), route.id(), route.version()).orElse(null);
        // A manually created draft has no planning snapshot: it can still be safely
        // resequenced, but must not acquire invented arrival/departure times.
        if (snapshot == null) {
            if (published) throw new Conflict("SNAPSHOT_MISSING");
            return persistDraftReorder(route, command, actor);
        }
        if (!snapshot.validUntil().isAfter(clock.instant())) throw new Conflict("SNAPSHOT_EXPIRED");
        Map<UUID, PlanningSnapshot.Visit> visits = new HashMap<>();
        snapshot.visits().forEach(v -> visits.put(v.pointId(), v));
        if (visits.size() != route.points().size() || !visits.keySet().equals(new HashSet<>(command.routePointIds())))
            throw new Conflict("SNAPSHOT_STALE");
        Instant current = snapshot.shiftStart();
        UUID previous = null;
        List<Route.Point> reordered = new ArrayList<>();
        for (int index = 0; index < command.routePointIds().size(); index++) {
            UUID pointId = command.routePointIds().get(index);
            PlanningSnapshot.Visit visit = visits.get(pointId);
            current = current.plusSeconds(previous == null ? snapshot.startLeg(pointId).seconds() : snapshot.leg(previous, pointId).seconds());
            Instant arrival = current;
            if (visit.windowStart() != null && current.isBefore(visit.windowStart())) current = visit.windowStart();
            if (visit.windowEnd() != null && current.isAfter(visit.windowEnd()))
                throw new Conflict("SNAPSHOT_INCOMPLETE");
            Instant departure = current.plusSeconds(visit.serviceSeconds());
            if (departure.isAfter(snapshot.shiftEnd())) throw new Conflict("SNAPSHOT_INCOMPLETE");
            Route.Point old = route.points().stream().filter(p -> p.id().equals(pointId)).findFirst().orElseThrow(Invalid::new);
            reordered.add(new Route.Point(old.id(), old.customerId(), index + 1, old.location(), arrival, departure));
            current = departure;
            previous = pointId;
        }
        Route updated = new Route(route.id(), route.tenantId(), route.name(), route.date(), route.sellerId(), route.startLocation(), reordered, route.createdAt(), clock.instant(), route.version() + 1, route.status());
        routes.replacePointsAndVersion(updated, route.version());
        snapshots.supersedeAndCopy(snapshot, updated.version());
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.ROUTE, route.id(), AuditResult.SUCCESS, Map.of("version", Long.toString(route.version())), Map.of("version", Long.toString(updated.version()), "pointCount", Integer.toString(reordered.size())))))
            throw new IllegalStateException("audit persistence failed");
        if (published) {
            outbox.append(new OutboxEvent(UUID.randomUUID(), "route.modified", 1, updated.updatedAt(), actor.tenantId(), command.correlationId(), route.id(),
                    "{\"routeId\":\"" + route.id() + "\",\"tenantId\":\"" + actor.tenantId() + "\",\"routeVersion\":\"" + updated.version()
                            + "\",\"recipientTechnicalIds\":[\"" + route.sellerId() + "\"]}"));
        }
        return updated;
    }

    private Route persistDraftReorder(Route route, Command command, AuthenticatedActor actor) {
        Map<UUID, Route.Point> existing = new HashMap<>();
        route.points().forEach(point -> existing.put(point.id(), point));
        List<Route.Point> reordered = new ArrayList<>();
        for (int index = 0; index < command.routePointIds().size(); index++) {
            Route.Point point = existing.get(command.routePointIds().get(index));
            if (point == null) throw new Invalid("ROUTE_POINT_IDS_MISMATCH");
            reordered.add(new Route.Point(point.id(), point.customerId(), index + 1, point.location(),
                    point.plannedArrivalAt(), point.plannedDepartureAt()));
        }
        Route updated = new Route(route.id(), route.tenantId(), route.name(), route.date(), route.sellerId(),
                route.startLocation(), reordered, route.createdAt(), clock.instant(), route.version() + 1, route.status());
        routes.replacePointsAndVersion(updated, route.version());
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.ROUTE, route.id(),
                AuditResult.SUCCESS, Map.of("version", Long.toString(route.version())),
                Map.of("version", Long.toString(updated.version()), "pointCount", Integer.toString(reordered.size())))))
            throw new IllegalStateException("audit persistence failed");
        return updated;
    }

    private static void validate(Command c, AuthenticatedActor a) {
        if (a == null || a.accountId() == null || a.tenantId() == null || (a.role() != BaseRole.COMPANY_ADMIN && a.role() != BaseRole.SUPERVISOR))
            throw new Forbidden();
        if (c == null || c.routeId() == null || c.correlationId() == null || c.baseRouteVersion() < 1 || c.routePointIds() == null || c.routePointIds().isEmpty() || c.routePointIds().size() > 50 || c.routePointIds().stream().anyMatch(Objects::isNull) || new HashSet<>(c.routePointIds()).size() != c.routePointIds().size())
            throw new Invalid("INVALID_REORDER_REQUEST");
    }

    private void authorize(AuthenticatedActor actor, Route route) {
        try {
            var scope = scopes.resolve(actor);
            if (!actor.tenantId().equals(route.tenantId()) || (!scope.allCurrentPortfolios() && !scope.sellerIds().contains(route.sellerId())))
                throw new Forbidden();
        } catch (PortfolioAccessScopeUseCase.Forbidden e) {
            throw new Forbidden();
        }
    }

    private static boolean samePermutation(List<Route.Point> points, List<UUID> ids) {
        return points.size() == ids.size() && points.stream().map(Route.Point::id).collect(java.util.stream.Collectors.toSet()).equals(new HashSet<>(ids));
    }
}
