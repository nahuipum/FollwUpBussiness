package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.out.CompanyCodeGenerator;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCompanyCodeGenerator implements CompanyCodeGenerator {
    private final JdbcTemplate jdbc;

    public JdbcCompanyCodeGenerator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String nextCode() {
        Long value = jdbc.queryForObject("SELECT nextval('tenancy_company_code_sequence')", Long.class);
        return "EMP-%06d".formatted(value);
    }
}
