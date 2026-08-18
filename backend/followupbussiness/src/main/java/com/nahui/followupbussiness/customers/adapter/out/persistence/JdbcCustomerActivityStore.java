package com.nahui.followupbussiness.customers.adapter.out.persistence;

import com.nahui.followupbussiness.customers.application.port.out.CustomerActivityStore;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * PostgreSQL activity facts, materialized by future visit and sale producers.
 */
public final class JdbcCustomerActivityStore implements CustomerActivityStore {
    private final JdbcTemplate jdbc;

    public JdbcCustomerActivityStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Instant> lastCompletedVisit(UUID tenantId, UUID customerId) {
        return fact(tenantId, customerId, "last_completed_visit_at");
    }

    @Override
    public Optional<Instant> lastConfirmedPurchase(UUID tenantId, UUID customerId) {
        return fact(tenantId, customerId, "last_confirmed_purchase_at");
    }

    private Optional<Instant> fact(UUID tenantId, UUID customerId, String column) {
        return jdbc.query("select " + column + " from customer_activity_fact where tenant_id=? and customer_id=?", (rs, row) -> rs.getTimestamp(1) == null ? null : rs.getTimestamp(1).toInstant(), tenantId, customerId).stream().findFirst();
    }
}
