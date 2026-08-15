package com.nahui.followupbussiness.workforce.adapter.out.persistence;

import com.nahui.followupbussiness.workforce.application.port.out.TerritoryStore;
import com.nahui.followupbussiness.workforce.domain.*;

import java.sql.Timestamp;
import java.util.*;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcTerritoryStore implements TerritoryStore {
    private final JdbcTemplate jdbc;

    public JdbcTerritoryStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Territory> find(UUID t, UUID id) {
        return jdbc.query("select * from workforce_territory where tenant_id=? and id=?", this::map, t, id).stream().findFirst();
    }

    public List<Territory> list(UUID t, TerritoryStatus s, String q, int o, int n) {
        return jdbc.query("select * from workforce_territory where tenant_id=? and (? is null or status=?) and (? is null or lower(name) like lower(?)) order by name,id offset ? limit ?", this::map, t, s == null ? null : s.name(), s == null ? null : s.name(), q, q == null ? null : "%" + q + "%", o, n);
    }

    public long count(UUID t, TerritoryStatus s, String q) {
        Long x = jdbc.queryForObject("select count(*) from workforce_territory where tenant_id=? and (? is null or status=?) and (? is null or lower(name) like lower(?))", Long.class, t, s == null ? null : s.name(), s == null ? null : s.name(), q, q == null ? null : "%" + q + "%");
        return x == null ? 0 : x;
    }

    public boolean existsName(UUID t, String v, UUID e) {
        return exists(t, "name", v, e);
    }

    public boolean existsCode(UUID t, String v, UUID e) {
        return exists(t, "code", v, e);
    }

    private boolean exists(UUID t, String c, String v, UUID e) {
        Integer x = jdbc.queryForObject("select count(*) from workforce_territory where tenant_id=? and lower(" + c + ")=lower(?) and (? is null or id<>?)", Integer.class, t, v, e, e);
        return x != null && x > 0;
    }

    public Territory insert(Territory x) {
        jdbc.update("insert into workforce_territory(id,tenant_id,name,code,description,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,?,?)", x.id(), x.tenantId(), x.name(), x.code(), x.description(), x.status().name(), Timestamp.from(x.createdAt()), Timestamp.from(x.updatedAt()), x.version());
        return x;
    }

    public Optional<Territory> update(Territory x, long e) {
        return jdbc.update("update workforce_territory set name=?,code=?,description=?,status=?,updated_at=?,version=? where tenant_id=? and id=? and version=?", x.name(), x.code(), x.description(), x.status().name(), Timestamp.from(x.updatedAt()), x.version(), x.tenantId(), x.id(), e) == 1 ? Optional.of(x) : Optional.empty();
    }

    private Territory map(java.sql.ResultSet r, int x) throws java.sql.SQLException {
        return new Territory(r.getObject("id", UUID.class), r.getObject("tenant_id", UUID.class), r.getString("name"), r.getString("code"), r.getString("description"), TerritoryStatus.valueOf(r.getString("status")), r.getTimestamp("created_at").toInstant(), r.getTimestamp("updated_at").toInstant(), r.getLong("version"));
    }
}
