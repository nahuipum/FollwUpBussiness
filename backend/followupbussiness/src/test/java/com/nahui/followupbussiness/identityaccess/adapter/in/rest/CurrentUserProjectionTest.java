package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CurrentUserProjectionTest {
    @Test
    void tenantUserGetsTheCompleteActiveCompanyInsteadOfItsIdentifier() {
        UUID companyId = UUID.randomUUID();
        var user = projection(companyId).from(account(BaseRole.SELLER, companyId));

        assertThat(user.company()).isNotNull();
        assertThat(user.company().id()).isEqualTo(companyId);
        assertThat(user.company().legalName()).isEqualTo("Legal name");
        assertThat(user.company().settings().locationRetentionDays()).isEqualTo(90);
        assertThat(user.roles()).containsExactly("SELLER");
    }

    @Test
    void platformUserHasNoTenantCompanyAndTenantWithoutCompanyFailsSafely() {
        assertThat(projection(null).from(account(BaseRole.PLATFORM_SUPERADMIN, null)).company()).isNull();
        assertThatThrownBy(() -> projection(null).from(account(BaseRole.SELLER, null)))
                .isInstanceOf(CurrentUserProjection.Unauthenticated.class);
    }

    private static CurrentUserProjection projection(UUID expectedCompany) {
        return new CurrentUserProjection(null, id -> Optional.ofNullable(expectedCompany)
                .filter(expected -> expected.equals(id)).map(CurrentUserProjectionTest::company));
    }

    private static LoginAccountQuery.Account account(BaseRole role, UUID companyId) {
        return new LoginAccountQuery.Account(UUID.randomUUID(), "hash", role, companyId, "ACTIVE", "User", "user@example.test");
    }

    private static Company company(UUID id) {
        return new Company(id, "Legal name", null, "CODE", null, CompanyStatus.ACTIVE,
                new CompanySettings("UTC", "USD", 100, 60, 90, 30), Instant.EPOCH, Instant.EPOCH, 1);
    }
}
