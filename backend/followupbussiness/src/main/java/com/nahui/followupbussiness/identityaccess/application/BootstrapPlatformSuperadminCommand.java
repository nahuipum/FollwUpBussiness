package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;

import java.util.Arrays;
import java.util.Objects;
import java.util.UUID;

public final class BootstrapPlatformSuperadminCommand implements AutoCloseable {

    private static final String TEST_PROFILE_NAME = "Platform Administrator";
    private static final String TEST_PROFILE_EMAIL = "bootstrap@invalid.example";

    private final LoginIdentifier loginIdentifier;
    private final char[] password;
    private final String displayName;
    private final String email;
    private final UUID correlationId;

    public BootstrapPlatformSuperadminCommand(
            LoginIdentifier loginIdentifier,
            char[] password,
            UUID correlationId) {
        this(loginIdentifier, password, TEST_PROFILE_NAME, TEST_PROFILE_EMAIL, correlationId);
    }

    public BootstrapPlatformSuperadminCommand(
            LoginIdentifier loginIdentifier,
            char[] password,
            String displayName,
            String email,
            UUID correlationId) {
        this.loginIdentifier = Objects.requireNonNull(loginIdentifier, "Login identity is required");
        this.password = Objects.requireNonNull(password, "Password is required").clone();
        this.displayName = requireProfileValue(displayName, "Display name");
        this.email = requireProfileValue(email, "Email");
        this.correlationId = Objects.requireNonNull(correlationId, "Correlation id is required");
    }

    public LoginIdentifier loginIdentifier() {
        return loginIdentifier;
    }

    public char[] passwordCopy() {
        return password.clone();
    }

    public UUID correlationId() {
        return correlationId;
    }

    public String displayName() { return displayName; }

    public String email() { return email; }

    private static String requireProfileValue(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value;
    }

    @Override
    public void close() {
        Arrays.fill(password, '\0');
    }
}
