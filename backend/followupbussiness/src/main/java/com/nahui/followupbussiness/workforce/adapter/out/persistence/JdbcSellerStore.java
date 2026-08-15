package com.nahui.followupbussiness.workforce.adapter.out.persistence;

import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import java.sql.Timestamp;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcSellerStore implements SellerStore {
    private final JdbcTemplate jdbc;
    public JdbcSellerStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public boolean activeSupervisor(UUID tenant, UUID id) { return exists("select count(*) from identity_access_account where company_id=? and id=? and role_code='SUPERVISOR' and status='ACTIVE'", tenant, id); }
    public boolean activeTerritory(UUID tenant, UUID id) { return exists("select count(*) from workforce_territory where tenant_id=? and id=? and status='ACTIVE'", tenant, id); }
    private boolean exists(String sql, UUID tenant, UUID id) { Integer n=jdbc.queryForObject(sql,Integer.class,tenant,id); return n != null && n > 0; }
    public Seller insert(Seller s) {
        jdbc.update("insert into workforce_seller(id,tenant_id,user_id,display_name,email,phone,employee_code,supervisor_id,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,?,?,?,?,?)", s.id(),s.tenantId(),s.userId(),s.displayName(),s.email(),s.phone(),s.employeeCode(),s.supervisorId(),s.status().name(),Timestamp.from(s.createdAt()),Timestamp.from(s.updatedAt()),s.version());
        for (UUID territory : s.territoryIds()) jdbc.update("insert into workforce_seller_territory(seller_id,territory_id) values(?,?)",s.id(),territory);
        return s;
    }
}
