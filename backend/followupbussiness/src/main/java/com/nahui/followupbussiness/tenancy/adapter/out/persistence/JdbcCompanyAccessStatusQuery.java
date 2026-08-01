package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Objects;
import java.util.UUID;

public final class JdbcCompanyAccessStatusQuery implements CompanyAccessStatusQuery {

    private final JdbcTemplate jdbcTemplate;

    public JdbcCompanyAccessStatusQuery(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate is required");
    }

    @Override
    public boolean isActive(UUID companyId) {
        Objects.requireNonNull(companyId, "companyId is required");
        Integer matches = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM tenancy_company WHERE id = ? AND status = 'ACTIVE'",
                Integer.class,
                companyId);
        return matches != null && matches == 1;
    }
}
