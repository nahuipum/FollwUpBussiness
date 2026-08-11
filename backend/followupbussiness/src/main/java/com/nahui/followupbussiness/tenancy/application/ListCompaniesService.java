package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyListStore;

public final class ListCompaniesService implements ListCompaniesUseCase {
    private final CompanyListStore store;

    public ListCompaniesService(CompanyListStore store) { this.store = store; }

    @Override
    public Result execute(Query query, AuthenticatedActor actor) {
        if (actor == null || actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() != null) {
            throw new AccessDeniedException();
        }
        return new Result(store.find(query), store.count(query));
    }

    public static final class AccessDeniedException extends RuntimeException { }
}
