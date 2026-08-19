package com.nahui.followupbussiness.workforce.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Seller(UUID id, UUID tenantId, UUID userId, String displayName, String email, String phone,
                     String employeeCode, UUID supervisorId, List<UUID> territoryIds, SellerStatus status,
                     Instant createdAt, Instant updatedAt, long version) {
    public Seller(UUID id, UUID tenantId, UUID userId, String displayName, String email, String phone,
                  String employeeCode, UUID supervisorId, List<UUID> territoryIds, TerritoryStatus status,
                  Instant createdAt, Instant updatedAt, long version) {
        this(id, tenantId, userId, displayName, email, phone, employeeCode, supervisorId, territoryIds,
                SellerStatus.valueOf(status.name()), createdAt, updatedAt, version);
    }

    public void requireActiveForAssignment() {
        if (status != SellerStatus.ACTIVE) throw new InactiveForAssignment();
    }

    public static final class InactiveForAssignment extends RuntimeException { }
}
