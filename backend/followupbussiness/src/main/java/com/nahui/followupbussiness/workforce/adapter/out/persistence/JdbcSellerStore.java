package com.nahui.followupbussiness.workforce.adapter.out.persistence;

import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;

import java.sql.Timestamp;
import java.util.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;

public final class JdbcSellerStore implements SellerStore {
    private final JdbcTemplate jdbc;

    public JdbcSellerStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean activeSupervisor(UUID tenant, UUID id) {
        return exists("select count(*) from identity_access_account where company_id=? and id=? and role_code='SUPERVISOR' and status='ACTIVE'", tenant, id);
    }

    public boolean activeTerritory(UUID tenant, UUID id) {
        return exists("select count(*) from workforce_territory where tenant_id=? and id=? and status='ACTIVE'", tenant, id);
    }

    private boolean exists(String sql, UUID tenant, UUID id) {
        Integer n = jdbc.queryForObject(sql, Integer.class, tenant, id);
        return n != null && n > 0;
    }

    private boolean exists(String sql, UUID tenant, String value, UUID id) {
        Integer n = jdbc.queryForObject(sql, Integer.class, tenant, value, id);
        return n != null && n > 0;
    }

    public Seller insert(Seller s) {
        jdbc.update("insert into workforce_seller(id,tenant_id,user_id,display_name,email,phone,employee_code,supervisor_id,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,?,?,?,?,?)", s.id(), s.tenantId(), s.userId(), s.displayName(), s.email(), s.phone(), s.employeeCode(), s.supervisorId(), s.status().name(), Timestamp.from(s.createdAt()), Timestamp.from(s.updatedAt()), s.version());
        for (UUID territory : s.territoryIds())
            jdbc.update("insert into workforce_seller_territory(seller_id,territory_id) values(?,?)", s.id(), territory);
        return s;
    }

    @Override
    public boolean existsEmployeeCode(UUID tenant, String employeeCode, UUID excludingSellerId) {
        return exists("select count(*) from workforce_seller where tenant_id=? and lower(employee_code)=lower(?) and id<>?", tenant, employeeCode, excludingSellerId);
    }

    @Override
    public void lockEmployeeCode(UUID tenant, String employeeCode) {
        jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?::text, 0))", Long.class, tenant + ":" + employeeCode.toLowerCase(Locale.ROOT));
    }

    @Override
    public Optional<Seller> update(Seller seller, long expectedVersion) {
        int updated = jdbc.update("update workforce_seller set display_name=?,phone=?,employee_code=?,updated_at=?,version=? where tenant_id=? and id=? and version=?",
                seller.displayName(), seller.phone(), seller.employeeCode(), Timestamp.from(seller.updatedAt()), seller.version(), seller.tenantId(), seller.id(), expectedVersion);
        return updated == 1 ? Optional.of(seller) : Optional.empty();
    }

    public Optional<Seller> find(UUID tenant, UUID id) {
        List<Seller> sellers = jdbc.query("select * from workforce_seller where tenant_id=? and id=?", (RowMapper<Seller>) this::map, tenant, id);
        populateTerritories(sellers);
        return sellers.stream().findFirst();
    }

    public List<Seller> list(UUID tenant, UUID teamSupervisor, com.nahui.followupbussiness.workforce.domain.TerritoryStatus status,
                             UUID requestedSupervisor, UUID territory, String search, int offset, int limit) {
        String sql = "select distinct s.* from workforce_seller s left join workforce_seller_territory st on st.seller_id=s.id where s.tenant_id=? and (? is null or s.supervisor_id=?) and (? is null or s.status=?) and (? is null or s.supervisor_id=?) and (? is null or st.territory_id=?) and (? is null or lower(s.display_name) like lower(?) or lower(s.email) like lower(?) or lower(coalesce(s.employee_code,'')) like lower(?)) order by s.display_name,s.id offset ? limit ?";
        List<Seller> sellers = jdbc.query(sql, (RowMapper<Seller>) this::map, tenant, teamSupervisor, teamSupervisor, status == null ? null : status.name(), status == null ? null : status.name(), requestedSupervisor, requestedSupervisor, territory, territory, search, search == null ? null : "%" + search + "%", search == null ? null : "%" + search + "%", search == null ? null : "%" + search + "%", offset, limit);
        populateTerritories(sellers);
        return sellers;
    }

    public long count(UUID tenant, UUID teamSupervisor, com.nahui.followupbussiness.workforce.domain.TerritoryStatus status,
                      UUID requestedSupervisor, UUID territory, String search) {
        String sql = "select count(distinct s.id) from workforce_seller s left join workforce_seller_territory st on st.seller_id=s.id where s.tenant_id=? and (? is null or s.supervisor_id=?) and (? is null or s.status=?) and (? is null or s.supervisor_id=?) and (? is null or st.territory_id=?) and (? is null or lower(s.display_name) like lower(?) or lower(s.email) like lower(?) or lower(coalesce(s.employee_code,'')) like lower(?))";
        Long total = jdbc.queryForObject(sql, Long.class, tenant, teamSupervisor, teamSupervisor, status == null ? null : status.name(), status == null ? null : status.name(), requestedSupervisor, requestedSupervisor, territory, territory, search, search == null ? null : "%" + search + "%", search == null ? null : "%" + search + "%", search == null ? null : "%" + search + "%");
        return total == null ? 0 : total;
    }

    private void populateTerritories(List<Seller> sellers) {
        if (sellers.isEmpty()) return;
        Map<UUID, List<UUID>> territories = new HashMap<>();
        for (Seller seller : sellers) territories.put(seller.id(), new ArrayList<>());
        String placeholders = String.join(",", Collections.nCopies(sellers.size(), "?"));
        jdbc.query("select seller_id,territory_id from workforce_seller_territory where seller_id in (" + placeholders + ") order by seller_id,territory_id", (RowCallbackHandler) row -> territories.get(row.getObject("seller_id", UUID.class)).add(row.getObject("territory_id", UUID.class)), sellers.stream().map(Seller::id).toArray());
        for (int index = 0; index < sellers.size(); index++) {
            Seller seller = sellers.get(index);
            List<UUID> ids = List.copyOf(territories.get(seller.id()));
            sellers.set(index, new Seller(seller.id(), seller.tenantId(), seller.userId(), seller.displayName(), seller.email(), seller.phone(), seller.employeeCode(), seller.supervisorId(), ids, seller.status(), seller.createdAt(), seller.updatedAt(), seller.version()));
        }
    }

    private Seller map(java.sql.ResultSet row, int index) throws java.sql.SQLException {
        return new Seller(row.getObject("id", UUID.class), row.getObject("tenant_id", UUID.class), row.getObject("user_id", UUID.class), row.getString("display_name"), row.getString("email"), row.getString("phone"), row.getString("employee_code"), row.getObject("supervisor_id", UUID.class), List.of(), com.nahui.followupbussiness.workforce.domain.TerritoryStatus.valueOf(row.getString("status")), row.getTimestamp("created_at").toInstant(), row.getTimestamp("updated_at").toInstant(), row.getLong("version"));
    }
}
