package com.nahui.followupbussiness.identityaccess.application;

import java.util.Objects;
import java.util.UUID;

public record BootstrapPlatformSuperadminResult(Status status, UUID accountId, UUID correlationId) {

    public BootstrapPlatformSuperadminResult {
        Objects.requireNonNull(status, "Status is required");
        Objects.requireNonNull(correlationId, "Correlation id is required");
    }

    public enum Status {
        CREATED,
        ALREADY_PROVISIONED,
        CONFLICT
    }
}
