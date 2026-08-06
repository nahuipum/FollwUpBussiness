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
        String reason,
        Instant occurredAt) {

    private static final Set<String> ALLOWED_CHANGE_FIELDS = Set.of("status");
    private static final Set<String> ALLOWED_SCOPES = Set.of(
            AuditScope.AUTHORIZED_RESOURCE.name(),
            AuditScope.PLATFORM.name(),
            AuditScope.TENANT_BOUND_DENIAL.name(),
            "ANONYMOUS_AUTH");

    public AuditEntry {
        Objects.requireNonNull(id, "id is required");
        scope = requiredText(scope, "scope");
        if (!ALLOWED_SCOPES.contains(scope)) {
            throw new IllegalArgumentException("scope is not allowed");
        }
        if ("PLATFORM".equals(scope)) {
            if (tenantId != null) throw new IllegalArgumentException("PLATFORM audit entries must not have a tenantId");
        } else if ("TENANT_BOUND_DENIAL".equals(scope)) {
            if (tenantId == null) throw new IllegalArgumentException("TENANT_BOUND_DENIAL audit entries require a tenantId");
        } else if (!"ANONYMOUS_AUTH".equals(scope) && tenantId == null) {
            throw new IllegalArgumentException("tenantId is required outside PLATFORM scope");
        }
        Objects.requireNonNull(actorId, "actorId is required");
        Objects.requireNonNull(action, "action is required");
        resourceType = requiredText(resourceType, "resourceType");
        Objects.requireNonNull(resourceId, "resourceId is required");
        Objects.requireNonNull(result, "result is required");
        Objects.requireNonNull(correlationId, "correlationId is required");
        before = sanitized(before);
        after = sanitized(after);
        if (reason != null && (reason.length() < 5 || reason.length() > 500 || reason.chars().anyMatch(Character::isISOControl))) {
            throw new IllegalArgumentException("reason must be sanitized and contain between 5 and 500 characters");
        }
        Objects.requireNonNull(occurredAt, "occurredAt is required");
    }

    public AuditEntry(UUID id, UUID tenantId, UUID actorId, AuditAction action, String resourceType, UUID resourceId,
            AuditResult result, UUID correlationId, String scope, Map<String, String> before,
            Map<String, String> after, Instant occurredAt) {
        this(id, tenantId, actorId, action, resourceType, resourceId, result, correlationId, scope, before, after, null, occurredAt);
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
