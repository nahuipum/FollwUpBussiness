package com.nahui.followupbussiness.tenancy.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyListStore;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ListCompaniesServiceTest {
    private final CompanyListStore store = mock(CompanyListStore.class);
    private final ListCompaniesService service = new ListCompaniesService(store);
    private final ListCompaniesUseCase.Query query = new ListCompaniesUseCase.Query(0, 20, null, null);

    @Test void deniesCompanyBoundPlatformActorWithoutReadingCompanies() {
        var actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN);
        assertThatThrownBy(() -> service.execute(query, actor)).isInstanceOf(ListCompaniesService.AccessDeniedException.class);
        verifyNoInteractions(store);
    }

    @Test void deniesCompanyRoleWithoutReadingCompanies() {
        var actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN);
        assertThatThrownBy(() -> service.execute(query, actor)).isInstanceOf(ListCompaniesService.AccessDeniedException.class);
        verifyNoInteractions(store);
    }
}
