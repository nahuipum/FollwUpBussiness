package com.nahui.followupbussiness.routing.adapter.out.persistence;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcRouteStore implements RouteStore {
    private final JdbcTemplate jdbc;

    public JdbcRouteStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Reservation reserveIdempotency(UUID tenant, UUID actor, UUID key, String fingerprint, Instant now) {
        int inserted = jdbc.update("insert into route_idempotency(tenant_id,actor_id,idempotency_key,request_fingerprint,recorded_at,status) values(?,?,?,?,?,'PENDING') on conflict (tenant_id,actor_id,idempotency_key) do nothing", tenant, actor, key, fingerprint, Timestamp.from(now));
        if (inserted == 1) return new Reservation(true, null, fingerprint);
        Reservation result = jdbc.query("select route_id,request_fingerprint from route_idempotency where tenant_id=? and actor_id=? and idempotency_key=? and status='COMPLETED'", rs -> rs.next() ? new Reservation(false, rs.getObject(1, UUID.class), rs.getString(2)) : null, tenant, actor, key);
        if (result == null) throw new IllegalStateException("idempotency reservation is not complete");
        return result;
    }

    @Override
    public void save(Route route) {
        jdbc.update("insert into route(id,tenant_id,name,operational_date,seller_id,start_location,status,created_at,updated_at,version) values(?,?,?,?,?,CASE WHEN ? THEN NULL ELSE ST_SetSRID(ST_MakePoint(?,?),4326) END,'DRAFT',?,?,?)", route.id(), route.tenantId(), route.name(), route.date(), route.sellerId(), route.startLocation() == null, route.startLocation() == null ? null : route.startLocation().longitude(), route.startLocation() == null ? null : route.startLocation().latitude(), Timestamp.from(route.createdAt()), Timestamp.from(route.updatedAt()), route.version());
        for (Route.Point point : route.points())
            jdbc.update("insert into route_point(id,tenant_id,route_id,customer_id,sequence,status,location) values(?,?,?,?,?,'PENDING',ST_SetSRID(ST_MakePoint(?,?),4326))", point.id(), route.tenantId(), route.id(), point.customerId(), point.sequence(), point.location().longitude(), point.location().latitude());
    }

    @Override
    public void completeIdempotency(UUID tenant, UUID actor, UUID key, UUID route) {
        jdbc.update("update route_idempotency set route_id=?,status='COMPLETED' where tenant_id=? and actor_id=? and idempotency_key=? and status='PENDING'", route, tenant, actor, key);
    }

    @Override
    public Optional<Route> find(UUID tenant, UUID routeId) {
        return find(tenant, routeId, false);
    }

    @Override public Optional<Route> findForUpdate(UUID tenant, UUID routeId) { return find(tenant, routeId, true); }

    private Optional<Route> find(UUID tenant, UUID routeId, boolean lock) {
        return jdbc.query("select id,tenant_id,name,operational_date,seller_id,ST_Y(start_location),ST_X(start_location),created_at,updated_at,version,status from route where tenant_id=? and id=?" + (lock ? " for update" : ""), rs -> {
            if (!rs.next()) return Optional.empty();
            UUID id = rs.getObject(1, UUID.class);
            List<Route.Point> points = jdbc.query("select id,customer_id,sequence,ST_Y(location),ST_X(location),planned_arrival_at,planned_departure_at from route_point where tenant_id=? and route_id=? order by sequence", (p, row) -> new Route.Point(p.getObject(1, UUID.class), p.getObject(2, UUID.class), p.getInt(3), new GeoPoint(p.getDouble(4), p.getDouble(5)), p.getTimestamp(6)==null?null:p.getTimestamp(6).toInstant(), p.getTimestamp(7)==null?null:p.getTimestamp(7).toInstant()), tenant, id);
            Double latitude = (Double) rs.getObject(6), longitude = (Double) rs.getObject(7);
            GeoPoint start = latitude == null ? null : new GeoPoint(latitude, longitude);
            return Optional.of(new Route(id, rs.getObject(2, UUID.class), rs.getString(3), rs.getDate(4).toLocalDate(), rs.getObject(5, UUID.class), start, points, rs.getTimestamp(8).toInstant(), rs.getTimestamp(9).toInstant(), rs.getLong(10), rs.getString(11)));
        }, tenant, routeId);
    }

    @Override public void replacePointsAndVersion(Route route, long expectedVersion) {
        if (jdbc.update("update route set updated_at=?,version=? where tenant_id=? and id=? and version=?", Timestamp.from(route.updatedAt()),route.version(),route.tenantId(),route.id(),expectedVersion)!=1) throw new IllegalStateException("route version changed");
        int offset=route.points().size()+1;
        jdbc.update("update route_point set sequence=sequence+? where tenant_id=? and route_id=?",offset,route.tenantId(),route.id());
        for(Route.Point point:route.points()) jdbc.update("update route_point set sequence=?,planned_arrival_at=?,planned_departure_at=? where tenant_id=? and route_id=? and id=?",point.sequence(),Timestamp.from(point.plannedArrivalAt()),Timestamp.from(point.plannedDepartureAt()),route.tenantId(),route.id(),point.id());
    }
}
