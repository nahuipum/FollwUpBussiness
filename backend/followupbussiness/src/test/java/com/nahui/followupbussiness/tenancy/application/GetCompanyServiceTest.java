package com.nahui.followupbussiness.tenancy.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyDetailStore;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class GetCompanyServiceTest {
    @Test void platformSuperadminWithoutTenantCanReadAnExistingCompany() {
        UUID companyId = UUID.randomUUID();
        CompanyDetailStore store = id -> Optional.empty();
        assertThat(new GetCompanyService(store).execute(companyId,
                new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN))).isEmpty();
    }

    @Test void tenantBoundPlatformActorIsDeniedBeforeTheStoreIsRead() {
        CompanyDetailStore store = id -> { throw new AssertionError("No debe consultar la empresa"); };
        assertThatThrownBy(() -> new GetCompanyService(store).execute(UUID.randomUUID(),
                new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN)))
                .isInstanceOf(GetCompanyService.AccessDeniedException.class);
    }
}
