package com.nahui.followupbussiness.customers.domain;

import java.time.Instant;
import java.util.UUID;

public record Customer(UUID id, UUID tenantId, String name, String documentType, String documentNumber, String phone,
                       String email, String address, GeoPoint location, Integer visitFrequencyDays, UUID territoryId,
                       String status, Instant createdAt, Instant updatedAt, long version) {
    public Customer {
        if (id == null || tenantId == null || name == null || name.isBlank() || name.length() > 200 || address == null || address.isBlank() || address.length() > 300 || location == null || createdAt == null || updatedAt == null || version < 1) {
            throw new IllegalArgumentException("invalid customer");
        }
        if (documentType != null && (documentType.isBlank() || documentType.length() > 30) || documentNumber != null && (documentNumber.isBlank() || documentNumber.length() > 40) || phone != null && (phone.isBlank() || phone.length() > 30) || email != null && (email.isBlank() || email.length() > 254) || visitFrequencyDays != null && (visitFrequencyDays < 1 || visitFrequencyDays > 365) || !("ACTIVE".equals(status) || "INACTIVE".equals(status))) {
            throw new IllegalArgumentException("invalid customer");
        }
    }
}
