package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;

import java.util.Arrays;
import java.util.Objects;
import java.util.UUID;

public final class BootstrapPlatformSuperadminCommand implements AutoCloseable {

    private final LoginIdentifier loginIdentifier;
    private final char[] password;
    private final UUID correlationId;

    public BootstrapPlatformSuperadminCommand(
            LoginIdentifier loginIdentifier,
            char[] password,
            UUID correlationId) {
        this.loginIdentifier = Objects.requireNonNull(loginIdentifier, "Login identity is required");
        this.password = Objects.requireNonNull(password, "Password is required").clone();
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

    @Override
    public void close() {
        Arrays.fill(password, '\0');
    }
}
