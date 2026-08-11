package com.nahui.followupbussiness.identityaccess.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.nahui.followupbussiness.identityaccess.application.port.out.CompanyAdminInvitationQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ListCompanyAdminInvitationsServiceTest {
    @Test void platformSuperadminCanReadOnlyRequestedCompanyInvitations() {
        UUID company = UUID.randomUUID();
        var query = new Query();
        var service = new ListCompanyAdminInvitationsService(query);

        var result = service.execute(company, new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN));

        assertThat(query.companyId).isEqualTo(company);
        assertThat(result).isEmpty();
    }

    @Test void tenantBoundOrNonPlatformActorCannotRead() {
        var query = new Query();
        var service = new ListCompanyAdminInvitationsService(query);
        UUID company = UUID.randomUUID();

        assertThatThrownBy(() -> service.execute(company, new AuthenticatedActor(UUID.randomUUID(), company, BaseRole.PLATFORM_SUPERADMIN)))
                .isInstanceOf(ListCompanyAdminInvitationsService.Forbidden.class);
        assertThatThrownBy(() -> service.execute(company, new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.COMPANY_ADMIN)))
                .isInstanceOf(ListCompanyAdminInvitationsService.Forbidden.class);
        assertThat(query.companyId).isNull();
    }

    private static final class Query implements CompanyAdminInvitationQuery {
        private UUID companyId;
        @Override public List<CompanyAdminInvitation> listByCompany(UUID companyId) {
            this.companyId = companyId;
            return List.of();
        }
    }
}
