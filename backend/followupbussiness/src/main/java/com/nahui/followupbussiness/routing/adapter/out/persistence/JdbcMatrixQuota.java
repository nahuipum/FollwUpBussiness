package com.nahui.followupbussiness.routing.adapter.out.persistence;

import com.nahui.followupbussiness.routing.application.port.out.MatrixQuota;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

public final class JdbcMatrixQuota implements MatrixQuota {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;

    public JdbcMatrixQuota(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.transaction = null;
    }

    public JdbcMatrixQuota(JdbcTemplate jdbc, PlatformTransactionManager transactions) {
        this.jdbc = jdbc;
        this.transaction = new TransactionTemplate(transactions);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @Override
    public boolean reserve(UUID tenantId, UUID accountId, LocalDate day) {
        if (transaction != null)
            return Boolean.TRUE.equals(transaction.execute(status -> reserveDurably(tenantId, accountId, day)));
        return reserveDurably(tenantId, accountId, day);
    }

    private boolean reserveDurably(UUID tenantId, UUID accountId, LocalDate day) {
        var rows = jdbc.query("insert into route_matrix_quota(tenant_id,account_id,operational_date,used_matrices) values(?,?,?,1) "
                        + "on conflict(tenant_id,account_id,operational_date) do update set used_matrices=route_matrix_quota.used_matrices+1 "
                        + "where route_matrix_quota.used_matrices<35 returning used_matrices",
                (result, index) -> result.getInt(1), tenantId, accountId, day);
        return !rows.isEmpty();
    }
}
