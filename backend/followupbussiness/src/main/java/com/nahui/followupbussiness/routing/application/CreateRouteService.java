package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.*;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

public final class CreateRouteService implements CreateRouteUseCase {
    private final RouteStore routes; private final CustomerPortfolioReadUseCase customers; private final SellerReferenceUseCase sellers;
    private final PortfolioAccessScopeUseCase scopes; private final RecordAuditEntryUseCase audit; private final Clock clock;
    public CreateRouteService(RouteStore routes, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, RecordAuditEntryUseCase audit, Clock clock) { this.routes=routes; this.customers=customers; this.sellers=sellers; this.scopes=scopes; this.audit=audit; this.clock=clock; }

    @Override @Transactional(isolation = Isolation.SERIALIZABLE)
    public Route create(Command command, AuthenticatedActor actor) {
        validate(command, actor);
        String fingerprint = fingerprint(command);
        var reservation = routes.reserveIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), fingerprint, clock.instant());
        if (!reservation.owner()) {
            if (!fingerprint.equals(reservation.fingerprint())) throw new Conflict();
            authorizeCurrentAccess(command, actor);
            return routes.find(actor.tenantId(), reservation.routeId()).orElseThrow(Conflict::new);
        }
        var references = authorizeCurrentAccess(command, actor);
        Map<UUID, com.nahui.followupbussiness.customers.domain.GeoPoint> locations = new HashMap<>();
        references.forEach(reference -> locations.put(reference.id(), reference.location()));
        UUID id = UUID.randomUUID();
        Route route = new Route(id, actor.tenantId(), command.name(), command.date(), command.sellerId(), command.startLocation(),
                java.util.stream.IntStream.range(0, command.customerIds().size()).mapToObj(index -> new Route.Point(UUID.randomUUID(), command.customerIds().get(index), index + 1, locations.get(command.customerIds().get(index)))).toList(), clock.instant(), clock.instant(), 1);
        routes.save(route);
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.ROUTE, id, AuditResult.SUCCESS, Map.of(), Map.of("status", "DRAFT")))) throw new IllegalStateException("audit persistence failed");
        routes.completeIdempotency(actor.tenantId(), actor.accountId(), command.idempotencyKey(), id);
        return route;
    }
    private void authorizeResources(Command c, AuthenticatedActor actor) {
        if (!sellers.allActive(actor.tenantId(), Set.of(c.sellerId()))) throw new Forbidden();
        try {
            var scope = scopes.resolve(actor);
            if (!scope.allCurrentPortfolios() && !scope.sellerIds().contains(c.sellerId())) throw new Forbidden();
        } catch (PortfolioAccessScopeUseCase.Forbidden ex) { throw new Forbidden(); }
    }
    private List<CustomerPortfolioReadUseCase.RouteCustomer> authorizeCurrentAccess(Command command, AuthenticatedActor actor) {
        authorizeResources(command, actor);
        var references = customers.activeAssignedToSellerAt(actor.tenantId(), command.sellerId(), command.customerIds(), command.date());
        if (references.size() != command.customerIds().size()) throw new Forbidden();
        return references;
    }
    private static void validate(Command c, AuthenticatedActor a) {
        if (a == null || a.tenantId() == null || a.accountId() == null || (a.role()!=BaseRole.COMPANY_ADMIN && a.role()!=BaseRole.SUPERVISOR)) throw new Forbidden();
        if (c == null || c.date()==null || c.sellerId()==null || c.idempotencyKey()==null || c.customerIds()==null || c.customerIds().isEmpty() || c.customerIds().size()>500 || new HashSet<>(c.customerIds()).size()!=c.customerIds().size() || c.customerIds().stream().anyMatch(Objects::isNull)) throw new Invalid();
    }
    private static String fingerprint(Command c) { try { String location=c.startLocation()==null ? "" : c.startLocation().latitude()+","+c.startLocation().longitude(); String canonical=(c.name()==null ? "" : c.name().trim())+"|"+c.date()+"|"+c.sellerId()+"|"+location+"|"+String.join(",", c.customerIds().stream().map(UUID::toString).toList()); return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8))); } catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); } }
}
