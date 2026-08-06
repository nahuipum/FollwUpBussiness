package com.nahui.followupbussiness.audit.domain;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AuditEntryTest {
    @Test
    void rejectsNonAllowlistedOrPotentiallySensitiveChangeData() {
        assertThatThrownBy(() -> entry(Map.of("password", "SECRET"), Map.of()))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> entry(Map.of(), Map.of("status", "customer@example.com")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsUnknownScopesWithAndWithoutTenantAndAcceptsClosedScopeMatrix() {
        assertThatThrownBy(() -> entry(UUID.randomUUID(), "UNRECOGNIZED_SCOPE"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> entry(null, "UNRECOGNIZED_SCOPE"))
                .isInstanceOf(IllegalArgumentException.class);

        entry(UUID.randomUUID(), "AUTHORIZED_RESOURCE");
        entry(null, "PLATFORM");
        entry(UUID.randomUUID(), "TENANT_BOUND_DENIAL");
        entry(null, "ANONYMOUS_AUTH");
    }

    private static AuditEntry entry(Map<String, String> before, Map<String, String> after) {
        return new AuditEntry(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), AuditAction.CRITICAL_MUTATION,
                "CUSTOMER", UUID.randomUUID(), AuditResult.SUCCESS, UUID.randomUUID(), "AUTHORIZED_RESOURCE", before, after,
                Instant.parse("2026-08-04T12:00:00Z"));
    }

    private static AuditEntry entry(UUID tenantId, String scope) {
        return new AuditEntry(UUID.randomUUID(), tenantId, UUID.randomUUID(), AuditAction.CRITICAL_MUTATION,
                "CUSTOMER", UUID.randomUUID(), AuditResult.SUCCESS, UUID.randomUUID(), scope, Map.of(), Map.of(),
                Instant.parse("2026-08-04T12:00:00Z"));
    }
}
