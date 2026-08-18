package com.nahui.followupbussiness.customers.adapter.out.persistence;

import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;

import java.sql.Timestamp;
import java.util.UUID;
import java.util.Optional;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCustomerStore implements CustomerStore {
    private final JdbcTemplate jdbc;

    public JdbcCustomerStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Customer insert(Customer c) {
        jdbc.update("insert into customer(id,tenant_id,name,document_type,document_number,phone,email,segment,address,location,visit_frequency_days,territory_id,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,?,?,ST_SetSRID(ST_MakePoint(?,?),4326),?,?, 'ACTIVE',?,?,?)", c.id(), c.tenantId(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.segment(), c.address(), c.location().longitude(), c.location().latitude(), c.visitFrequencyDays(), c.territoryId(), Timestamp.from(c.createdAt()), Timestamp.from(c.updatedAt()), c.version());
        return c;
    }

    public Optional<Customer> find(UUID tenantId, UUID customerId) {
        return jdbc.query("select id,tenant_id,name,document_type,document_number,phone,email,segment,address,ST_Y(location),ST_X(location),visit_frequency_days,territory_id,status,created_at,updated_at,version from customer where tenant_id=? and id=?", (rs, row) -> new Customer(UUID.fromString(rs.getString(1)), UUID.fromString(rs.getString(2)), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9), new com.nahui.followupbussiness.customers.domain.GeoPoint(rs.getDouble(10), rs.getDouble(11)), (Integer) rs.getObject(12), rs.getObject(13, UUID.class), rs.getString(14), rs.getTimestamp(15).toInstant(), rs.getTimestamp(16).toInstant(), rs.getLong(17)), tenantId, customerId).stream().findFirst();
    }

    public boolean update(Customer c, long expectedVersion) {
        return jdbc.update("update customer set name=?,document_type=?,document_number=?,phone=?,email=?,segment=?,address=?,location=ST_SetSRID(ST_MakePoint(?,?),4326),visit_frequency_days=?,territory_id=?,status=?,updated_at=?,version=? where tenant_id=? and id=? and version=?", c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.segment(), c.address(), c.location().longitude(), c.location().latitude(), c.visitFrequencyDays(), c.territoryId(), c.status(), Timestamp.from(c.updatedAt()), c.version(), c.tenantId(), c.id(), expectedVersion) == 1;
    }

    public List<DuplicateMatch> findDuplicateMatches(UUID tenantId, DuplicateCriteria criteria) {
        String normalizedDocument = criteria.documentNumber();
        String normalizedPhone = criteria.phone();
        String sql = """
                select id,tenant_id,name,document_type,document_number,phone,email,segment,address,ST_Y(location),ST_X(location),visit_frequency_days,territory_id,status,created_at,updated_at,version,
                  (cast(? as varchar) is not null and lower(regexp_replace(document_number, '[ -]', '', 'g'))=?) as document_match,
                  (cast(? as varchar) is not null and lower(regexp_replace(phone, '[ -]', '', 'g'))=?) as phone_match,
                  lower(trim(name))=? as name_match, (cast(? as varchar) is not null and lower(trim(address))=?) as address_match,
                  (cast(? as double precision) is not null and ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?,?),4326)::geography, 100)) as location_match
                from customer
                where tenant_id=? and (cast(? as uuid) is null or id<>?) and (
                  (cast(? as varchar) is not null and lower(regexp_replace(document_number, '[ -]', '', 'g'))=?) or
                  (cast(? as varchar) is not null and lower(regexp_replace(phone, '[ -]', '', 'g'))=?) or
                  lower(trim(name))=? or (cast(? as varchar) is not null and lower(trim(address))=?) or
                  (cast(? as double precision) is not null and ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?,?),4326)::geography, 100))
                )
                """;
        Object[] parameters = {normalizedDocument, normalizedDocument, normalizedPhone, normalizedPhone, criteria.name(), criteria.address(), criteria.address(),
                criteria.latitude(), criteria.longitude(), criteria.latitude(), tenantId, criteria.excludeCustomerId(), criteria.excludeCustomerId(),
                normalizedDocument, normalizedDocument, normalizedPhone, normalizedPhone, criteria.name(), criteria.address(), criteria.address(),
                criteria.latitude(), criteria.longitude(), criteria.latitude()};
        return jdbc.query(sql, (rs, row) -> {
            Customer customer = new Customer(UUID.fromString(rs.getString(1)), UUID.fromString(rs.getString(2)), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9), new com.nahui.followupbussiness.customers.domain.GeoPoint(rs.getDouble(10), rs.getDouble(11)), (Integer) rs.getObject(12), rs.getObject(13, UUID.class), rs.getString(14), rs.getTimestamp(15).toInstant(), rs.getTimestamp(16).toInstant(), rs.getLong(17));
            Set<MatchedField> fields = new LinkedHashSet<>();
            if (rs.getBoolean(18)) fields.add(MatchedField.DOCUMENT);
            if (rs.getBoolean(19)) fields.add(MatchedField.PHONE);
            if (rs.getBoolean(20)) fields.add(MatchedField.NAME);
            if (rs.getBoolean(21)) fields.add(MatchedField.ADDRESS);
            if (rs.getBoolean(22)) fields.add(MatchedField.LOCATION);
            return new DuplicateMatch(customer, Set.copyOf(fields));
        }, parameters);
    }
}
