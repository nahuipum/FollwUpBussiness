package com.nahui.followupbussiness.identityaccess.domain.model;

import java.util.Arrays;
import java.util.Optional;

public enum BaseRole {

    PLATFORM_SUPERADMIN("PLATFORM_SUPERADMIN", RoleScope.PLATFORM),
    COMPANY_ADMIN("COMPANY_ADMIN", RoleScope.COMPANY),
    SUPERVISOR("SUPERVISOR", RoleScope.COMPANY),
    SELLER("SELLER", RoleScope.COMPANY);

    private final String code;
    private final RoleScope scope;

    BaseRole(String code, RoleScope scope) {
        this.code = code;
        this.scope = scope;
    }

    public String code() {
        return code;
    }

    public RoleScope scope() {
        return scope;
    }

    public static Optional<BaseRole> findByCode(String code) {
        if (code == null) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(role -> role.code.equals(code))
                .findFirst();
    }
}
