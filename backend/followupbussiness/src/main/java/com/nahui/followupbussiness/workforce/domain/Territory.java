package com.nahui.followupbussiness.workforce.domain;

import java.time.Instant;
import java.util.UUID;

public record Territory(UUID id, UUID tenantId, String name, String code, String description,
                        TerritoryStatus status, Instant createdAt, Instant updatedAt, long version) {
    public Territory {
        if (id == null || tenantId == null || name == null || name.isBlank() || name.length() > 160 || status == null)
            throw new IllegalArgumentException("invalid territory");
        if (code != null && (code.isBlank() || code.length() > 40)) throw new IllegalArgumentException("invalid code");
        if (description != null && description.length() > 500)
            throw new IllegalArgumentException("invalid description");
    }
}
