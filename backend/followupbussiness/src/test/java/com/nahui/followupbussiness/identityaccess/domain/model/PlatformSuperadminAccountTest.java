package com.nahui.followupbussiness.identityaccess.domain.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PlatformSuperadminAccountTest {

    @Test
    void factoryAlwaysCreatesOnlyThePlatformRoleWithoutCompany() {
        PlatformSuperadminAccount account = PlatformSuperadminAccount.create(
                UUID.randomUUID(),
                new LoginIdentifier("operator-" + UUID.randomUUID() + "@invalid.example"),
                "test-hash",
                Instant.parse("2026-07-28T00:00:00Z"));

        assertThat(account.role()).isEqualTo(BaseRole.PLATFORM_SUPERADMIN);
        assertThat(account.companyId()).isNull();
    }

    @Test
    void domainRejectsCompanyRoleOrCompanyAssociation() {
        LoginIdentifier identifier =
                new LoginIdentifier("operator-" + UUID.randomUUID() + "@invalid.example");

        assertThatThrownBy(() -> new PlatformSuperadminAccount(
                UUID.randomUUID(),
                identifier,
                "test-hash",
                BaseRole.COMPANY_ADMIN,
                UUID.randomUUID(),
                Instant.now()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
