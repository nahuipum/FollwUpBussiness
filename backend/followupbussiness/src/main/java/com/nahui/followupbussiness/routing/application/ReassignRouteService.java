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
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
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

public final class ReassignRouteService implements ReassignRouteUseCase {
    private final RouteStore routes; private final SellerReferenceUseCase sellers;
    private final PortfolioAccessScopeUseCase scopes; private final OutboxStore outbox; private final RecordAuditEntryUseCase audit; private final Clock clock;

    public ReassignRouteService(RouteStore routes, SellerReferenceUseCase sellers,
                                PortfolioAccessScopeUseCase scopes, OutboxStore outbox, RecordAuditEntryUseCase audit, Clock clock) {
        this.routes = routes; this.sellers = sellers; this.scopes = scopes; this.outbox = outbox; this.audit = audit; this.clock = clock;
    }

    @Override public Route reassign(Command command, AuthenticatedActor actor) {
        validate(command, actor);
        Route route = routes.findForUpdate(actor.tenantId(), command.routeId()).orElseThrow(Forbidden::new);
        authorize(actor, route, command.sellerId());
        Set<UUID> sellerIds = route.sellerId().equals(command.sellerId()) ? Set.of(route.sellerId()) : Set.of(route.sellerId(), command.sellerId());
        if (!sellers.allActive(actor.tenantId(), sellerIds)) throw new Forbidden();
        String fingerprint = fingerprint(command);
        var reservation = routes.reserveReassignmentIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), fingerprint, clock.instant());
        if (!reservation.owner()) {
            if (!fingerprint.equals(reservation.fingerprint()) || !route.id().equals(reservation.routeId())) throw new Conflict();
            return route;
        }
        if (!"PUBLISHED".equals(route.status()) || route.version() != command.expectedVersion()) throw new Conflict();
        Instant now = clock.instant();
        Route reassigned = new Route(route.id(), route.tenantId(), route.name(), route.date(), command.sellerId(), route.startLocation(), route.points(), route.createdAt(), now, route.version() + 1, route.status());
        try { routes.reassign(reassigned, route.version()); }
        catch (RouteStore.Conflict ex) { throw new Conflict(); }
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.ROUTE, route.id(), AuditResult.SUCCESS,
                Map.of("sellerId", route.sellerId().toString(), "status", route.status(), "version", Long.toString(route.version())),
                Map.of("sellerId", reassigned.sellerId().toString(), "status", reassigned.status(), "version", Long.toString(reassigned.version())))))
            throw new IllegalStateException("audit persistence failed");
        outbox.append(new OutboxEvent(UUID.randomUUID(), "route.reassigned", 1, now, actor.tenantId(), command.correlationId(), route.id(), payload(reassigned)));
        routes.completeReassignmentIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), route.id());
        return reassigned;
    }

    private static void validate(Command command, AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.accountId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR)) throw new Forbidden();
        if (command == null || command.routeId() == null || command.sellerId() == null || command.expectedVersion() < 1 || command.idempotencyKey() == null || command.correlationId() == null
                || command.reason() == null || command.reason().trim().length() < 5 || command.reason().trim().length() > 500) throw new Invalid();
    }

    private void authorize(AuthenticatedActor actor, Route route, UUID newSellerId) {
        try {
            var scope = scopes.resolve(actor);
            if (!actor.tenantId().equals(route.tenantId()) || (!scope.allCurrentPortfolios() && (!scope.sellerIds().contains(route.sellerId()) || !scope.sellerIds().contains(newSellerId)))) throw new Forbidden();
        } catch (PortfolioAccessScopeUseCase.Forbidden ex) { throw new Forbidden(); }
    }

    private static String fingerprint(Command command) {
        try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((command.routeId() + "|" + command.sellerId() + "|" + command.expectedVersion() + "|" + command.reason().trim()).getBytes(StandardCharsets.UTF_8))); }
        catch (Exception ex) { throw new IllegalStateException(ex); }
    }

    private static String payload(Route route) {
        return "{\"routeId\":\"" + route.id() + "\",\"tenantId\":\"" + route.tenantId() + "\",\"routeVersion\":\"" + route.version() + "\",\"routeOperationalDate\":\"" + route.date() + "\",\"sellerId\":\"" + route.sellerId() + "\",\"recipientTechnicalIds\":[\"" + route.sellerId() + "\"],\"notifySeller\":true}";
    }
}
