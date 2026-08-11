package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompanyCurrenciesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyCurrencyCatalog;
import java.util.List;

public final class ListCompanyCurrenciesService implements ListCompanyCurrenciesUseCase {
    private final CompanyCurrencyCatalog catalog;
    public ListCompanyCurrenciesService(CompanyCurrencyCatalog catalog) { this.catalog = catalog; }
    @Override public List<Currency> execute(AuthenticatedActor actor) {
        if (actor == null || actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() != null) throw new AccessDeniedException();
        return catalog.activeCurrencies();
    }
    public static final class AccessDeniedException extends RuntimeException { }
}
