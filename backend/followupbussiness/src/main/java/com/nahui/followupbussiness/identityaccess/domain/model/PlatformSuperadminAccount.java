package com.nahui.followupbussiness.identityaccess.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record PlatformSuperadminAccount(
        UUID id,
        LoginIdentifier loginIdentifier,
        String passwordHash,
        BaseRole role,
        UUID companyId,
        Instant createdAt) {

    public PlatformSuperadminAccount {
        Objects.requireNonNull(id, "Account id is required");
        Objects.requireNonNull(loginIdentifier, "Login identity is required");
        Objects.requireNonNull(passwordHash, "Password hash is required");
        Objects.requireNonNull(role, "Role is required");
        Objects.requireNonNull(createdAt, "Creation time is required");
        if (passwordHash.isBlank()) {
            throw new IllegalArgumentException("Password hash is required");
        }
        if (role != BaseRole.PLATFORM_SUPERADMIN) {
            throw new IllegalArgumentException("A platform bootstrap account must use PLATFORM_SUPERADMIN");
        }
        if (companyId != null) {
            throw new IllegalArgumentException("A platform bootstrap account must not belong to a company");
        }
    }

    public static PlatformSuperadminAccount create(
            UUID id,
            LoginIdentifier loginIdentifier,
            String passwordHash,
            Instant createdAt) {
        return new PlatformSuperadminAccount(
                id,
                loginIdentifier,
                passwordHash,
                BaseRole.PLATFORM_SUPERADMIN,
                null,
                createdAt);
    }
}
