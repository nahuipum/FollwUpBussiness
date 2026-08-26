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
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public final class CopyRouteService implements CopyRouteUseCase {
    private final RouteStore routes;
    private final CustomerPortfolioReadUseCase customers;
    private final SellerReferenceUseCase sellers;
    private final TerritoryReferenceUseCase territories;
    private final PortfolioAccessScopeUseCase scopes;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;

    public CopyRouteService(RouteStore routes, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers,
                            TerritoryReferenceUseCase territories, PortfolioAccessScopeUseCase scopes,
                            RecordAuditEntryUseCase audit, Clock clock) {
        this.routes = routes; this.customers = customers; this.sellers = sellers; this.territories = territories;
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
        List<Route.Point> points = copyEligiblePoints(source, eligible, actor, warnings);
        var now = clock.instant();
        Route copied = new Route(UUID.randomUUID(), actor.tenantId(), command.name() == null ? source.name() : command.name(),
                command.date(), command.sellerId(), source.startLocation(), points, now, now, 1, "DRAFT");
        routes.save(copied);
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

    private List<Route.Point> copyEligiblePoints(Route source, Map<UUID, CustomerPortfolioReadUseCase.RouteCustomer> eligible,
                                                  AuthenticatedActor actor, List<Warning> warnings) {
        List<Route.Point> copied = new ArrayList<>();
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
            copied.add(new Route.Point(UUID.randomUUID(), reference.id(), copied.size() + 1, reference.location()));
        }
        return copied;
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
}
