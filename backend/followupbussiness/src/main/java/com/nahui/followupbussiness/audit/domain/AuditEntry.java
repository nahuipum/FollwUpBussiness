package com.nahui.followupbussiness.audit.domain;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** Immutable, append-only evidence of one critical operation. */
public record AuditEntry(
        UUID id,
        UUID tenantId,
        UUID actorId,
        AuditAction action,
        String resourceType,
        UUID resourceId,
        AuditResult result,
        UUID correlationId,
        String scope,
        Map<String, String> before,
        Map<String, String> after,
        Instant occurredAt) {

    private static final Set<String> ALLOWED_CHANGE_FIELDS = Set.of("status");

    public AuditEntry {
        Objects.requireNonNull(id, "id is required");
        Objects.requireNonNull(tenantId, "tenantId is required");
        Objects.requireNonNull(actorId, "actorId is required");
        Objects.requireNonNull(action, "action is required");
        resourceType = requiredText(resourceType, "resourceType");
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(result, "result is required");
        Objects.requireNonNull(correlationId, "correlationId is required");
        scope = requiredText(scope, "scope");
        before = sanitized(before);
        after = sanitized(after);
        Objects.requireNonNull(occurredAt, "occurredAt is required");
    }

    private static String requiredText(String value, String name) {
        if (value == null || value.isBlank() || value.length() > 120) {
            throw new IllegalArgumentException(name + " is required and must be at most 120 characters");
        }
        return value;
    }

    private static Map<String, String> sanitized(Map<String, String> values) {
        if (values == null || values.isEmpty()) {
            return Map.of();
        }
        if (!ALLOWED_CHANGE_FIELDS.containsAll(values.keySet())
                || values.values().stream().anyMatch(value -> value == null || !value.matches("[A-Z_]{1,64}"))) {
            throw new IllegalArgumentException("Only approved, non-null audit change fields may be recorded");
        }
        return Map.copyOf(values);
    }
}
