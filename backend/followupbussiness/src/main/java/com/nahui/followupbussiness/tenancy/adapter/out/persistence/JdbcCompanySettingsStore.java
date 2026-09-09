package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.out.CompanySettingsStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCompanySettingsStore implements CompanySettingsStore {
    private final JdbcTemplate jdbc;
    public JdbcCompanySettingsStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public Optional<Company> findActiveByTenantId(UUID tenantId) {
        return jdbc.query("""
                SELECT c.id,c.legal_name,c.trade_name,c.code,c.tax_id,c.status,s.timezone,s.currency,
                       s.geofence_radius_meters,s.tracking_interval_seconds,s.location_retention_days,
                       s.sale_edit_window_minutes,s.planning_day_start,s.planning_day_end,c.created_at,c.updated_at,c.version
                  FROM tenancy_company c JOIN tenancy_company_settings s ON s.company_id=c.id
                 WHERE c.id=? AND c.status='ACTIVE' FOR UPDATE OF c
                """, (rs, row) -> map(rs), tenantId).stream().findFirst();
    }
    @Override public Optional<Company> update(UUID tenantId, CompanySettings settings, long expectedVersion, Instant updatedAt) {
        int changed = jdbc.update("UPDATE tenancy_company SET updated_at=?,version=version+1 WHERE id=? AND status='ACTIVE' AND version=?",
                Timestamp.from(updatedAt), tenantId, expectedVersion);
        if (changed != 1) return Optional.empty();
        jdbc.update("UPDATE tenancy_company_settings SET timezone=?,currency=?,sale_edit_window_minutes=?,planning_day_start=?,planning_day_end=? WHERE company_id=?",
                settings.timezone(), settings.currency(), settings.saleEditWindowMinutes(), settings.planningDayStart(), settings.planningDayEnd(), tenantId);
        return findActiveByTenantId(tenantId);
    }
    private static Company map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Company(rs.getObject("id", UUID.class), rs.getString("legal_name"), rs.getString("trade_name"), rs.getString("code"), rs.getString("tax_id"),
                CompanyStatus.valueOf(rs.getString("status")), new CompanySettings(rs.getString("timezone"), rs.getString("currency"), rs.getInt("geofence_radius_meters"),
                rs.getInt("tracking_interval_seconds"), rs.getInt("location_retention_days"), (Integer) rs.getObject("sale_edit_window_minutes"),
                rs.getObject("planning_day_start", java.time.LocalTime.class), rs.getObject("planning_day_end", java.time.LocalTime.class)),
                rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant(), rs.getLong("version"));
    }
}
