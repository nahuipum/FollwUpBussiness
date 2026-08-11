package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyListStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCompanyListStore implements CompanyListStore {
    private static final String SELECT = """
            SELECT c.id,c.legal_name,c.trade_name,c.code,c.tax_id,c.status,
                   s.timezone,s.currency,s.geofence_radius_meters,s.tracking_interval_seconds,
                   s.location_retention_days,s.sale_edit_window_minutes,c.created_at,c.updated_at,c.version
              FROM tenancy_company c
              JOIN tenancy_company_settings s ON s.company_id=c.id
            """;
    private final JdbcTemplate jdbc;

    public JdbcCompanyListStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public List<Company> find(ListCompaniesUseCase.Query query) {
        var parameters = parameters(query);
        parameters.add(query.pageSize());
        parameters.add((long) query.page() * query.pageSize());
        return jdbc.query(SELECT + whereClause(query) + " ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?", this::map, parameters.toArray());
    }

    @Override
    public long count(ListCompaniesUseCase.Query query) {
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM tenancy_company c" + whereClause(query), Long.class, parameters(query).toArray());
        return total == null ? 0 : total;
    }

    private static String whereClause(ListCompaniesUseCase.Query query) {
        StringBuilder clause = new StringBuilder(" WHERE 1=1");
        if (query.status() != null) clause.append(" AND c.status=?");
        if (query.search() != null && !query.search().isBlank()) {
            clause.append(" AND (c.legal_name ILIKE ? ESCAPE '\\' OR c.trade_name ILIKE ? ESCAPE '\\' OR c.code ILIKE ? ESCAPE '\\')");
        }
        return clause.toString();
    }

    private static List<Object> parameters(ListCompaniesUseCase.Query query) {
        var parameters = new ArrayList<Object>();
        if (query.status() != null) parameters.add(query.status().name());
        if (query.search() != null && !query.search().isBlank()) {
            String value = "%" + query.search().strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            parameters.add(value);
            parameters.add(value);
            parameters.add(value);
        }
        return parameters;
    }

    private Company map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new Company(rs.getObject("id", UUID.class), rs.getString("legal_name"), rs.getString("trade_name"),
                rs.getString("code"), rs.getString("tax_id"), CompanyStatus.valueOf(rs.getString("status")),
                new CompanySettings(rs.getString("timezone"), rs.getString("currency"), rs.getInt("geofence_radius_meters"),
                        rs.getInt("tracking_interval_seconds"), rs.getInt("location_retention_days"),
                        (Integer) rs.getObject("sale_edit_window_minutes")), rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant(), rs.getLong("version"));
    }
}
