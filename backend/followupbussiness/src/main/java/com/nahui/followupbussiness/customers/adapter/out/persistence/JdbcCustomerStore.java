package com.nahui.followupbussiness.customers.adapter.out.persistence;

import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import java.sql.Timestamp;
import java.util.UUID;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCustomerStore implements CustomerStore {
    private final JdbcTemplate jdbc;
    public JdbcCustomerStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public boolean activeTerritory(UUID tenantId, UUID territoryId) { Integer count = jdbc.queryForObject("select count(*) from workforce_territory where tenant_id=? and id=? and status='ACTIVE'", Integer.class, tenantId, territoryId); return count != null && count == 1; }
    public Customer insert(Customer c) {
        jdbc.update("insert into customer(id,tenant_id,name,document_type,document_number,phone,email,address,location,visit_frequency_days,territory_id,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,?,ST_SetSRID(ST_MakePoint(?,?),4326),?,?, 'ACTIVE',?,?,?)", c.id(), c.tenantId(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.address(), c.location().longitude(), c.location().latitude(), c.visitFrequencyDays(), c.territoryId(), Timestamp.from(c.createdAt()), Timestamp.from(c.updatedAt()), c.version());
        return c;
    }
    public Optional<Customer> find(UUID tenantId, UUID customerId) {
        return jdbc.query("select id,tenant_id,name,document_type,document_number,phone,email,address,ST_Y(location),ST_X(location),visit_frequency_days,territory_id,status,created_at,updated_at,version from customer where tenant_id=? and id=?", (rs, row) -> new Customer(UUID.fromString(rs.getString(1)), UUID.fromString(rs.getString(2)), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), new com.nahui.followupbussiness.customers.domain.GeoPoint(rs.getDouble(9), rs.getDouble(10)), (Integer) rs.getObject(11), rs.getObject(12, UUID.class), rs.getString(13), rs.getTimestamp(14).toInstant(), rs.getTimestamp(15).toInstant(), rs.getLong(16)), tenantId, customerId).stream().findFirst();
    }
    public boolean update(Customer c, long expectedVersion) {
        return jdbc.update("update customer set name=?,document_type=?,document_number=?,phone=?,email=?,address=?,location=ST_SetSRID(ST_MakePoint(?,?),4326),visit_frequency_days=?,territory_id=?,status=?,updated_at=?,version=? where tenant_id=? and id=? and version=?", c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.address(), c.location().longitude(), c.location().latitude(), c.visitFrequencyDays(), c.territoryId(), c.status(), Timestamp.from(c.updatedAt()), c.version(), c.tenantId(), c.id(), expectedVersion) == 1;
    }
}
