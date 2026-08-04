package com.nahui.followupbussiness.outbox.application;

import java.util.Objects;
import java.util.UUID;

/** Identity supplied by a trusted authenticated inbound adapter. */
public record PlatformOperator(UUID operatorId, boolean platformSuperadmin) {
    public PlatformOperator {
        Objects.requireNonNull(operatorId, "operatorId is required");
    }
}
