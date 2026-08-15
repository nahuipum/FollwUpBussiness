package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.GetCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyDetailStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;

import java.util.Optional;
import java.util.UUID;

public final class GetCompanyService implements GetCompanyUseCase {
    private final CompanyDetailStore store;

    public GetCompanyService(CompanyDetailStore store) {
        this.store = store;
    }

    @Override
    public Optional<Company> execute(UUID companyId, AuthenticatedActor actor) {
        if (actor == null || actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() != null) {
            throw new AccessDeniedException();
        }
        return store.findById(companyId);
    }

    public static final class AccessDeniedException extends RuntimeException {
    }
}
