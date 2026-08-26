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

    @Override
    public boolean territoryBelongsToTenant(UUID tenant, UUID id) {
        return exists("select count(*) from workforce_territory where tenant_id=? and id=?", tenant, id);
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

    @Override
    public Optional<Seller> updateStatus(Seller seller, com.nahui.followupbussiness.workforce.domain.SellerStatus expectedStatus) {
        int updated = jdbc.update("update workforce_seller set status=?,updated_at=?,version=? where tenant_id=? and id=? and status=? and version=?",
                seller.status().name(), Timestamp.from(seller.updatedAt()), seller.version(), seller.tenantId(), seller.id(), expectedStatus.name(), seller.version() - 1);
        return updated == 1 ? Optional.of(seller) : Optional.empty();
    }

    @Override
    public Optional<Seller> updateSupervisor(Seller seller, UUID expectedSupervisorId, long expectedVersion) {
        int updated = jdbc.update("update workforce_seller set supervisor_id=?,updated_at=?,version=? where tenant_id=? and id=? and version=? and supervisor_id is not distinct from ?",
                seller.supervisorId(), Timestamp.from(seller.updatedAt()), seller.version(), seller.tenantId(), seller.id(), expectedVersion, expectedSupervisorId);
        return updated == 1 ? Optional.of(seller) : Optional.empty();
    }

    @Override
    public Optional<Seller> replaceTerritories(Seller seller, long expectedVersion) {
        int updated = jdbc.update("update workforce_seller set updated_at=?,version=? where tenant_id=? and id=? and version=?",
                Timestamp.from(seller.updatedAt()), seller.version(), seller.tenantId(), seller.id(), expectedVersion);
        if (updated != 1) return Optional.empty();
        jdbc.update("delete from workforce_seller_territory where seller_id=?", seller.id());
        for (UUID territoryId : seller.territoryIds())
            jdbc.update("insert into workforce_seller_territory(seller_id,territory_id) values(?,?)", seller.id(), territoryId);
        return Optional.of(seller);
    }

    public Optional<Seller> find(UUID tenant, UUID id) {
        List<Seller> sellers = jdbc.query("select * from workforce_seller where tenant_id=? and id=?", (RowMapper<Seller>) this::map, tenant, id);
        populateTerritories(sellers);
        return sellers.stream().findFirst();
    }

    @Override
    public Set<UUID> activeSellerIdsForUser(UUID tenant, UUID userId) {
        return new LinkedHashSet<>(jdbc.queryForList("select id from workforce_seller where tenant_id=? and user_id=? and status='ACTIVE'", UUID.class, tenant, userId));
    }

    @Override
    public Set<UUID> activeSellerIdsForSupervisor(UUID tenant, UUID supervisorId) {
        return new LinkedHashSet<>(jdbc.queryForList("select id from workforce_seller where tenant_id=? and supervisor_id=? and status='ACTIVE'", UUID.class, tenant, supervisorId));
    }
    @Override public Set<UUID> activeSellerIdsForTenant(UUID tenant) {
        return new LinkedHashSet<>(jdbc.queryForList("select id from workforce_seller where tenant_id=? and status='ACTIVE'", UUID.class, tenant));
    }

    public List<Seller> list(UUID tenant, UUID teamSupervisor, com.nahui.followupbussiness.workforce.domain.SellerStatus status,
                             UUID requestedSupervisor, UUID territory, String search, int offset, int limit) {
        Filter filter = filter(tenant, teamSupervisor, status, requestedSupervisor, territory, search);
        List<Object> parameters = new ArrayList<>(filter.parameters());
        parameters.add(offset);
        parameters.add(limit);
        String sql = "select distinct s.* from workforce_seller s left join workforce_seller_territory st on st.seller_id=s.id"
                + filter.where() + " order by s.display_name,s.id offset ? limit ?";
        List<Seller> sellers = jdbc.query(sql, (RowMapper<Seller>) this::map, parameters.toArray());
        populateTerritories(sellers);
        return sellers;
    }

    public long count(UUID tenant, UUID teamSupervisor, com.nahui.followupbussiness.workforce.domain.SellerStatus status,
                      UUID requestedSupervisor, UUID territory, String search) {
        Filter filter = filter(tenant, teamSupervisor, status, requestedSupervisor, territory, search);
        String sql = "select count(distinct s.id) from workforce_seller s left join workforce_seller_territory st on st.seller_id=s.id" + filter.where();
        Long total = jdbc.queryForObject(sql, Long.class, filter.parameters().toArray());
        return total == null ? 0 : total;
    }

    private static Filter filter(UUID tenant, UUID teamSupervisor, com.nahui.followupbussiness.workforce.domain.SellerStatus status,
                                 UUID requestedSupervisor, UUID territory, String search) {
        StringBuilder where = new StringBuilder(" where s.tenant_id=?");
        List<Object> parameters = new ArrayList<>();
        parameters.add(tenant);
        if (teamSupervisor != null) {
            where.append(" and s.supervisor_id=?");
            parameters.add(teamSupervisor);
        }
        if (status != null) {
            where.append(" and s.status=?");
            parameters.add(status.name());
        }
        if (requestedSupervisor != null) {
            where.append(" and s.supervisor_id=?");
            parameters.add(requestedSupervisor);
        }
        if (territory != null) {
            where.append(" and st.territory_id=?");
            parameters.add(territory);
        }
        if (search != null) {
            where.append(" and (lower(s.display_name) like lower(?) or lower(s.email) like lower(?) or lower(coalesce(s.employee_code,'')) like lower(?))");
            String pattern = "%" + search + "%";
            parameters.add(pattern);
            parameters.add(pattern);
            parameters.add(pattern);
        }
        return new Filter(where.toString(), List.copyOf(parameters));
    }

    private record Filter(String where, List<Object> parameters) {
    }

    @Override
    public Map<UUID, SellerReferences> references(UUID tenant, List<Seller> sellers) {
        if (tenant == null || sellers == null || sellers.isEmpty()) return Map.of();
        Map<UUID, SellerReferences> references = new LinkedHashMap<>();
        Set<UUID> supervisorIds = new LinkedHashSet<>();
        Map<UUID, List<Territory>> territories = new LinkedHashMap<>();
        for (Seller seller : sellers) {
            references.put(seller.id(), new SellerReferences(null, List.of()));
            territories.put(seller.id(), new ArrayList<>());
            if (seller.supervisorId() != null) supervisorIds.add(seller.supervisorId());
        }
        Map<UUID, Supervisor> supervisors = supervisors(tenant, supervisorIds);
        if (!territories.isEmpty()) {
            String sellerPlaceholders = String.join(",", Collections.nCopies(territories.size(), "?"));
            jdbc.query("select st.seller_id,t.id,t.code,t.name from workforce_seller_territory st join workforce_territory t on t.id=st.territory_id and t.tenant_id=? where st.seller_id in (" + sellerPlaceholders + ") order by st.seller_id,t.code,t.id",
                    (RowCallbackHandler) row -> territories.get(row.getObject("seller_id", UUID.class)).add(new Territory(row.getObject("id", UUID.class), row.getString("code"), row.getString("name"))),
                    join(tenant, territories.keySet()));
        }
        for (Seller seller : sellers) {
            Supervisor supervisor = seller.supervisorId() == null ? null : supervisors.get(seller.supervisorId());
            references.put(seller.id(), new SellerReferences(supervisor, territories.get(seller.id())));
        }
        return Map.copyOf(references);
    }

    private Map<UUID, Supervisor> supervisors(UUID tenant, Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        Map<UUID, Supervisor> values = new HashMap<>();
        jdbc.query("select id,display_name from identity_access_account where company_id=? and role_code='SUPERVISOR' and id in (" + placeholders + ")",
                (RowCallbackHandler) row -> {
                    UUID id = row.getObject("id", UUID.class);
                    values.put(id, new Supervisor(id, row.getString("display_name")));
                }, join(tenant, ids));
        return Map.copyOf(values);
    }

    private static Object[] join(UUID first, Collection<UUID> values) {
        Object[] arguments = new Object[values.size() + 1];
        arguments[0] = first;
        int index = 1;
        for (UUID value : values) arguments[index++] = value;
        return arguments;
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
        return new Seller(row.getObject("id", UUID.class), row.getObject("tenant_id", UUID.class), row.getObject("user_id", UUID.class), row.getString("display_name"), row.getString("email"), row.getString("phone"), row.getString("employee_code"), row.getObject("supervisor_id", UUID.class), List.of(), com.nahui.followupbussiness.workforce.domain.SellerStatus.valueOf(row.getString("status")), row.getTimestamp("created_at").toInstant(), row.getTimestamp("updated_at").toInstant(), row.getLong("version"));
    }
}
