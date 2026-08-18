package com.nahui.followupbussiness.workforce.application;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import java.util.Set;
import java.util.UUID;

/** Resolves the current, active workforce portfolio before customers applies filters. */
public final class PortfolioAccessScopeService implements PortfolioAccessScopeUseCase {
    private final SellerStore sellers;
    public PortfolioAccessScopeService(SellerStore sellers) { this.sellers = sellers; }
    @Override public Scope resolve(AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.accountId() == null || actor.role() == null) throw new PortfolioAccessScopeUseCase.Forbidden();
        UUID tenant = actor.tenantId();
        if (actor.role() == BaseRole.COMPANY_ADMIN) return new Scope(tenant, true, Set.of());
        if (actor.role() == BaseRole.SUPERVISOR) {
            if (!sellers.activeSupervisor(tenant, actor.accountId())) throw new PortfolioAccessScopeUseCase.Forbidden();
            return new Scope(tenant, false, sellers.activeSellerIdsForSupervisor(tenant, actor.accountId()));
        }
        if (actor.role() == BaseRole.SELLER) {
            Set<UUID> ids = sellers.activeSellerIdsForUser(tenant, actor.accountId());
            if (ids.isEmpty()) throw new PortfolioAccessScopeUseCase.Forbidden();
            return new Scope(tenant, false, ids);
        }
        throw new PortfolioAccessScopeUseCase.Forbidden();
    }
}
