package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.out.CompanyCreationStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.sql.Timestamp;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCompanyCreationStore implements CompanyCreationStore {
    private final JdbcTemplate jdbc;
    public JdbcCompanyCreationStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public boolean create(Company company) {
        int created = jdbc.update("""
                INSERT INTO tenancy_company(id, legal_name, trade_name, code, tax_id, status, created_at, updated_at, version)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 1) ON CONFLICT (code) WHERE code IS NOT NULL DO NOTHING
                """, company.id(), company.legalName(), company.tradeName(), company.code(), company.taxId(),
                Timestamp.from(company.createdAt()), Timestamp.from(company.updatedAt()));
        if (created != 1) return false;
        jdbc.update("""
                INSERT INTO tenancy_company_settings(company_id, timezone, currency, geofence_radius_meters, tracking_interval_seconds,
                    location_retention_days, sale_edit_window_minutes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, company.id(), company.settings().timezone(), company.settings().currency(), company.settings().geofenceRadiusMeters(),
                company.settings().trackingIntervalSeconds(), company.settings().locationRetentionDays(), company.settings().saleEditWindowMinutes(),
                Timestamp.from(company.createdAt()), Timestamp.from(company.updatedAt()));
        return true;
    }
}
