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

    private static AuditEntry entry(Map<String, String> before, Map<String, String> after) {
        return new AuditEntry(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), AuditAction.CRITICAL_MUTATION,
                "CUSTOMER", UUID.randomUUID(), AuditResult.SUCCESS, UUID.randomUUID(), "OWN_RESOURCE", before, after,
                Instant.parse("2026-08-04T12:00:00Z"));
    }
}
