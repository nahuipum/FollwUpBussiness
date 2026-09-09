package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.PlanningSnapshotStore;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class PublishRouteService implements PublishRouteUseCase {
    private final RouteStore routes;
    private final PlanningSnapshotStore snapshots;
    private final SellerReferenceUseCase sellers;
    private final PortfolioAccessScopeUseCase scopes;
    private final OutboxStore outbox;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;

    public PublishRouteService(RouteStore routes, PlanningSnapshotStore snapshots, SellerReferenceUseCase sellers,
                               PortfolioAccessScopeUseCase scopes, OutboxStore outbox, RecordAuditEntryUseCase audit, Clock clock) {
        this.routes = routes; this.snapshots = snapshots; this.sellers = sellers; this.scopes = scopes;
        this.outbox = outbox; this.audit = audit; this.clock = clock;
    }

    @Override
    public Route publish(Command command, AuthenticatedActor actor) {
        validate(command, actor);
        Route route = routes.findForUpdate(actor.tenantId(), command.routeId()).orElseThrow(Forbidden::new);
        authorize(actor, route);
        if (!sellers.allActive(actor.tenantId(), Set.of(route.sellerId()))) throw new Forbidden();
        String fingerprint = fingerprint(command);
        var reservation = routes.reservePublicationIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), fingerprint, clock.instant());
        if (!reservation.owner()) {
            if (!fingerprint.equals(reservation.fingerprint()) || !route.id().equals(reservation.routeId())) throw new Conflict();
            return route;
        }
        if (!"DRAFT".equals(route.status()) || route.version() != command.expectedVersion()) throw new Conflict();
        var snapshot = snapshots.findValidForUpdate(actor.tenantId(), route.id(), route.version()).orElseThrow(Conflict::new);
        if (!snapshot.validUntil().isAfter(clock.instant())) throw new Conflict();
        Instant now = clock.instant();
        Route published = new Route(route.id(), route.tenantId(), route.name(), route.date(), route.sellerId(), route.startLocation(),
                route.points(), route.createdAt(), now, route.version() + 1, "PUBLISHED");
        try { routes.publish(published, route.version()); }
        catch (RouteStore.Conflict ex) { throw new Conflict(); }
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.ROUTE, route.id(), AuditResult.SUCCESS,
                Map.of("status", route.status(), "version", Long.toString(route.version())),
                Map.of("status", published.status(), "version", Long.toString(published.version())))))
            throw new IllegalStateException("audit persistence failed");
        outbox.append(new OutboxEvent(UUID.randomUUID(), "route.published", 1, now, actor.tenantId(), command.correlationId(), route.id(), payload(published, command.notifySeller())));
        routes.completePublicationIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), route.id());
        return published;
    }

    private static void validate(Command command, AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.accountId() == null ||
                (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR)) throw new Forbidden();
        if (command == null || command.routeId() == null || command.expectedVersion() < 1 || command.idempotencyKey() == null || command.correlationId() == null)
            throw new Invalid();
    }

    private void authorize(AuthenticatedActor actor, Route route) {
        try {
            var scope = scopes.resolve(actor);
            if (!actor.tenantId().equals(route.tenantId()) || (!scope.allCurrentPortfolios() && !scope.sellerIds().contains(route.sellerId()))) throw new Forbidden();
        } catch (PortfolioAccessScopeUseCase.Forbidden ex) { throw new Forbidden(); }
    }

    private static String fingerprint(Command command) {
        try {
            String value = command.routeId() + "|" + command.expectedVersion() + "|" + command.notifySeller();
            return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) { throw new IllegalStateException(ex); }
    }

    private static String payload(Route route, boolean notifySeller) {
        return "{\"routeId\":\"" + route.id() + "\",\"tenantId\":\"" + route.tenantId() +
                "\",\"routeVersion\":\"" + route.version() + "\",\"routeOperationalDate\":\"" + route.date() +
                "\",\"recipientTechnicalIds\":[\"" + route.sellerId() + "\"],\"notifySeller\":" + notifySeller + "}";
    }
}
