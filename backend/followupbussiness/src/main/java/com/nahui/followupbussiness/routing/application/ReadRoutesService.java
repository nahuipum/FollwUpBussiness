package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/** Read boundary: scope is resolved before route filters, counts or points. */
public final class ReadRoutesService implements ReadRoutesUseCase {
    private final RouteStore routes;
    private final PortfolioAccessScopeUseCase scopes;
    private final SellerReferenceUseCase sellers;

    public ReadRoutesService(RouteStore routes, PortfolioAccessScopeUseCase scopes, SellerReferenceUseCase sellers) {
        this.routes = routes; this.scopes = scopes; this.sellers = sellers;
    }

    @Override public Page list(ListQuery query, AuthenticatedActor actor) {
        validateList(query, actor);
        Set<UUID> allowed = scope(actor);
        if (query.sellerId() != null && !allowed.contains(query.sellerId())) throw new Forbidden();
        int offset = Math.toIntExact((long) query.page() * query.pageSize());
        return new Page(routes.list(actor.tenantId(), allowed, query.date(), query.sellerId(), query.status(), offset, query.pageSize()),
                routes.count(actor.tenantId(), allowed, query.date(), query.sellerId(), query.status()));
    }

    @Override public Route get(UUID routeId, AuthenticatedActor actor) {
        if (routeId == null || actor == null || actor.tenantId() == null || actor.accountId() == null) throw new NotFound();
        if (actor.role() == BaseRole.SELLER) {
            Set<UUID> sellerIds = sellers.activeSellerIdsForUser(actor.tenantId(), actor.accountId());
            return routes.findAuthorized(actor.tenantId(), routeId, sellerIds, "PUBLISHED").orElseThrow(NotFound::new);
        }
        if (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR) throw new Forbidden();
        Set<UUID> allowed = scope(actor);
        return routes.findAuthorized(actor.tenantId(), routeId, allowed, null).orElseThrow(NotFound::new);
    }

    @Override public Route myRoute(LocalDate date, AuthenticatedActor actor) {
        if (date == null || actor == null || actor.tenantId() == null || actor.accountId() == null || actor.role() != BaseRole.SELLER) throw new NotFound();
        var found = routes.findPublishedForSellers(actor.tenantId(), sellers.activeSellerIdsForUser(actor.tenantId(), actor.accountId()), date);
        if (found.isEmpty()) throw new NotFound();
        if (found.size() != 1) throw new Conflict();
        return found.getFirst();
    }

    private Set<UUID> scope(AuthenticatedActor actor) {
        try {
            var scope = scopes.resolve(actor);
            if (scope == null || !actor.tenantId().equals(scope.tenantId())) throw new Forbidden();
            return scope.allCurrentPortfolios() ? routesSellerScope(actor) : scope.sellerIds();
        } catch (PortfolioAccessScopeUseCase.Forbidden ex) { throw new Forbidden(); }
    }
    private Set<UUID> routesSellerScope(AuthenticatedActor actor) {
        // A full scope is represented by the active seller set exposed through the workforce boundary.
        return sellers.activeSellerIdsForTenant(actor.tenantId());
    }
    private static void validateList(ListQuery q, AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.accountId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR)) throw new Forbidden();
        if (q == null || q.page() < 0 || q.pageSize() < 1 || q.pageSize() > 200 || (q.status() != null && !Set.of("DRAFT", "PUBLISHED", "IN_PROGRESS", "COMPLETED", "CANCELLED").contains(q.status())) || (long) q.page() * q.pageSize() > Integer.MAX_VALUE) throw new Invalid();
    }
}
