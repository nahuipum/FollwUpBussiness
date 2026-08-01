package com.nahui.followupbussiness.identityaccess.domain.model;

import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class BaseRoleTest {

    private static final Map<String, RoleScope> EXPECTED_ROLES = Map.of(
            "PLATFORM_SUPERADMIN", RoleScope.PLATFORM,
            "COMPANY_ADMIN", RoleScope.COMPANY,
            "SUPERVISOR", RoleScope.COMPANY,
            "SELLER", RoleScope.COMPANY);

    @Test
    void catalogContainsExactlyTheStableContractCodesAndScopes() {
        Map<String, RoleScope> actualRoles = Set.of(BaseRole.values()).stream()
                .collect(Collectors.toMap(BaseRole::code, BaseRole::scope));

        assertThat(actualRoles).containsExactlyInAnyOrderEntriesOf(EXPECTED_ROLES);
        assertThat(BaseRole.values())
                .allSatisfy(role -> assertThat(role.code()).isEqualTo(role.name()));
    }

    @Test
    void roleCodesAreUnique() {
        assertThat(Set.of(BaseRole.values()).stream().map(BaseRole::code))
                .doesNotHaveDuplicates();
    }

    @Test
    void unknownOrMissingCodesDoNotBecomeRoles() {
        assertThat(BaseRole.findByCode("ARBITRARY_ADMIN")).isEmpty();
        assertThat(BaseRole.findByCode("platform_superadmin")).isEmpty();
        assertThat(BaseRole.findByCode(null)).isEmpty();
    }
}
