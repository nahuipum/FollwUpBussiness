package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCurrentCompanyQuery implements CurrentCompanyQuery {
    private final JdbcTemplate jdbc;

    public JdbcCurrentCompanyQuery(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Company> findById(UUID companyId) {
        return jdbc.query("""
                SELECT c.id,c.legal_name,c.trade_name,c.code,c.tax_id,c.status,
                       s.timezone,s.currency,s.geofence_radius_meters,s.tracking_interval_seconds,
                       s.location_retention_days,s.sale_edit_window_minutes,s.planning_day_start,s.planning_day_end,c.created_at,c.updated_at,c.version
                  FROM tenancy_company c JOIN tenancy_company_settings s ON s.company_id=c.id
                 WHERE c.id=? AND c.status='ACTIVE' FOR UPDATE OF c
                """, (rs, row) -> new Company(rs.getObject("id", UUID.class), rs.getString("legal_name"),
                rs.getString("trade_name"), rs.getString("code"), rs.getString("tax_id"),
                CompanyStatus.valueOf(rs.getString("status")), new CompanySettings(rs.getString("timezone"),
                rs.getString("currency"), rs.getInt("geofence_radius_meters"), rs.getInt("tracking_interval_seconds"),
                rs.getInt("location_retention_days"), (Integer) rs.getObject("sale_edit_window_minutes"),
                rs.getObject("planning_day_start", java.time.LocalTime.class), rs.getObject("planning_day_end", java.time.LocalTime.class)),
                rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant(),
                rs.getLong("version")), companyId).stream().findFirst();
    }
    @Override public Optional<Company> findByIdForUpdate(UUID companyId) { return findById(companyId); }
}
