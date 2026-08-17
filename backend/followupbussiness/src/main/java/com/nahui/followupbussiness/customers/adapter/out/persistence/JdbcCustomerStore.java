package com.nahui.followupbussiness.customers.adapter.out.persistence;

import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import java.sql.Timestamp;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCustomerStore implements CustomerStore {
    private final JdbcTemplate jdbc;
    public JdbcCustomerStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public boolean activeTerritory(UUID tenantId, UUID territoryId) { Integer count = jdbc.queryForObject("select count(*) from workforce_territory where tenant_id=? and id=? and status='ACTIVE'", Integer.class, tenantId, territoryId); return count != null && count == 1; }
    public Customer insert(Customer c) {
        jdbc.update("insert into customer(id,tenant_id,name,document_type,document_number,phone,email,address,location,visit_frequency_days,territory_id,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,?,ST_SetSRID(ST_MakePoint(?,?),4326),?,?, 'ACTIVE',?,?,?)", c.id(), c.tenantId(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.address(), c.location().longitude(), c.location().latitude(), c.visitFrequencyDays(), c.territoryId(), Timestamp.from(c.createdAt()), Timestamp.from(c.updatedAt()), c.version());
        return c;
    }
}
