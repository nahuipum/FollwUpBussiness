package com.nahui.followupbussiness.routing.adapter.out.persistence;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DuplicateKeyException;

public final class JdbcRouteStore implements RouteStore {
    private final JdbcTemplate jdbc;

    public JdbcRouteStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Reservation reserveIdempotency(UUID tenant, UUID actor, UUID key, String fingerprint, Instant now) {
        int inserted = jdbc.update("insert into route_idempotency(tenant_id,actor_id,operation,idempotency_key,request_fingerprint,recorded_at,status) values(?,?, 'CREATE',?,?,?,'PENDING') on conflict (tenant_id,actor_id,operation,idempotency_key) do nothing", tenant, actor, key, fingerprint, Timestamp.from(now));
        if (inserted == 1) return new Reservation(true, null, fingerprint);
        Reservation result = jdbc.query("select route_id,request_fingerprint from route_idempotency where tenant_id=? and actor_id=? and operation='CREATE' and idempotency_key=? and status='COMPLETED'", rs -> rs.next() ? new Reservation(false, rs.getObject(1, UUID.class), rs.getString(2)) : null, tenant, actor, key);
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
        jdbc.update("update route_idempotency set route_id=?,status='COMPLETED' where tenant_id=? and actor_id=? and operation='CREATE' and idempotency_key=? and status='PENDING'", route, tenant, actor, key);
    }

    @Override
    public Optional<Route> find(UUID tenant, UUID routeId) {
        return find(tenant, routeId, false);
    }

    @Override public Optional<Route> findForUpdate(UUID tenant, UUID routeId) { return find(tenant, routeId, true); }

    @Override public Optional<Header> findHeader(UUID tenant, UUID routeId) {
        return jdbc.query("select id,tenant_id,seller_id,status from route where tenant_id=? and id=?", rs -> {
            if (!rs.next()) return Optional.empty();
            return Optional.of(new Header(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getObject(3, UUID.class), rs.getString(4)));
        }, tenant, routeId);
    }

    @Override public Optional<Route> findAuthorized(UUID tenant, UUID routeId, Set<UUID> allowedSellers, String requiredStatus) {
        if (allowedSellers == null || allowedSellers.isEmpty()) return Optional.empty();
        String placeholders = String.join(",", Collections.nCopies(allowedSellers.size(), "?"));
        String status = requiredStatus == null ? "" : " and r.status=?";
        var args = new ArrayList<Object>(); args.add(tenant); args.add(routeId); args.addAll(allowedSellers); if (requiredStatus != null) args.add(requiredStatus);
        return jdbc.query("select r.id,r.tenant_id,r.name,r.operational_date,r.seller_id,ST_Y(r.start_location),ST_X(r.start_location),r.created_at,r.updated_at,r.version,r.status,p.id,p.customer_id,p.sequence,ST_Y(p.location),ST_X(p.location),p.planned_arrival_at,p.planned_departure_at from route r left join route_point p on p.tenant_id=r.tenant_id and p.route_id=r.id where r.tenant_id=? and r.id=? and r.seller_id in (" + placeholders + ")" + status + " order by p.sequence", rs -> {
            if (!rs.next()) return Optional.empty();
            UUID id = rs.getObject(1, UUID.class), resultTenant = rs.getObject(2, UUID.class), seller = rs.getObject(5, UUID.class); String name = rs.getString(3), resultStatus = rs.getString(11); java.time.LocalDate date = rs.getDate(4).toLocalDate(); Double latitude = (Double) rs.getObject(6), longitude = (Double) rs.getObject(7); Instant createdAt = rs.getTimestamp(8).toInstant(), updatedAt = rs.getTimestamp(9).toInstant(); long version = rs.getLong(10); List<Route.Point> points = new ArrayList<>();
            do { if (rs.getObject(12) != null) points.add(new Route.Point(rs.getObject(12, UUID.class), rs.getObject(13, UUID.class), rs.getInt(14), new GeoPoint(rs.getDouble(15), rs.getDouble(16)), rs.getTimestamp(17) == null ? null : rs.getTimestamp(17).toInstant(), rs.getTimestamp(18) == null ? null : rs.getTimestamp(18).toInstant())); } while (rs.next());
            return Optional.of(new Route(id, resultTenant, name, date, seller, latitude == null ? null : new GeoPoint(latitude, longitude), points, createdAt, updatedAt, version, resultStatus));
        }, args.toArray());
    }

    private Optional<Route> find(UUID tenant, UUID routeId, boolean lock) {
        return jdbc.query("select id,tenant_id,name,operational_date,seller_id,ST_Y(start_location),ST_X(start_location),created_at,updated_at,version,status from route where tenant_id=? and id=?" + (lock ? " for update" : ""), rs -> {
            if (!rs.next()) return Optional.empty();
            UUID id = rs.getObject(1, UUID.class);
            return Optional.of(route(rs, points(tenant, id)));
        }, tenant, routeId);
    }

    @Override public List<Route> list(UUID tenant, Set<UUID> allowedSellers, java.time.LocalDate date, UUID seller, String status, int offset, int limit) {
        if (allowedSellers == null || allowedSellers.isEmpty()) return List.of();
        Filter filter = filter(tenant, allowedSellers, date, seller, status);
        var args = new ArrayList<Object>(filter.arguments()); args.add(offset); args.add(limit);
        return jdbc.query("select id,tenant_id,name,operational_date,seller_id,ST_Y(start_location),ST_X(start_location),created_at,updated_at,version,status from route" + filter.sql() + " order by operational_date desc,id asc offset ? limit ?", (rs, row) -> route(rs, points(tenant, rs.getObject(1, UUID.class))), args.toArray());
    }

    @Override public long count(UUID tenant, Set<UUID> allowedSellers, java.time.LocalDate date, UUID seller, String status) {
        if (allowedSellers == null || allowedSellers.isEmpty()) return 0;
        Filter filter = filter(tenant, allowedSellers, date, seller, status);
        Long value = jdbc.queryForObject("select count(*) from route" + filter.sql(), Long.class, filter.arguments().toArray());
        return value == null ? 0 : value;
    }

    @Override public List<Route> findPublishedForSellers(UUID tenant, Set<UUID> sellers, java.time.LocalDate date) {
        if (sellers == null || sellers.isEmpty()) return List.of();
        String placeholders = String.join(",", Collections.nCopies(sellers.size(), "?"));
        var args = new ArrayList<Object>(); args.add(tenant); args.add(date); args.addAll(sellers);
        return jdbc.query("select id,tenant_id,name,operational_date,seller_id,ST_Y(start_location),ST_X(start_location),created_at,updated_at,version,status from route where tenant_id=? and operational_date=? and status='PUBLISHED' and seller_id in (" + placeholders + ") order by id", (rs, row) -> route(rs, points(tenant, rs.getObject(1, UUID.class))), args.toArray());
    }

    private List<Route.Point> points(UUID tenant, UUID routeId) {
        return jdbc.query("select id,customer_id,sequence,ST_Y(location),ST_X(location),planned_arrival_at,planned_departure_at from route_point where tenant_id=? and route_id=? order by sequence", (p, row) -> new Route.Point(p.getObject(1, UUID.class), p.getObject(2, UUID.class), p.getInt(3), new GeoPoint(p.getDouble(4), p.getDouble(5)), p.getTimestamp(6)==null?null:p.getTimestamp(6).toInstant(), p.getTimestamp(7)==null?null:p.getTimestamp(7).toInstant()), tenant, routeId);
    }
    private static Route route(java.sql.ResultSet rs, List<Route.Point> points) throws java.sql.SQLException {
        Double latitude = (Double) rs.getObject(6), longitude = (Double) rs.getObject(7);
        GeoPoint start = latitude == null ? null : new GeoPoint(latitude, longitude);
        return new Route(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getDate(4).toLocalDate(), rs.getObject(5, UUID.class), start, points, rs.getTimestamp(8).toInstant(), rs.getTimestamp(9).toInstant(), rs.getLong(10), rs.getString(11));
    }
    private static Filter filter(UUID tenant, Set<UUID> allowed, java.time.LocalDate date, UUID seller, String status) {
        String placeholders = String.join(",", Collections.nCopies(allowed.size(), "?"));
        StringBuilder sql = new StringBuilder(" where tenant_id=? and seller_id in (" + placeholders + ")");
        var args = new ArrayList<Object>(); args.add(tenant); args.addAll(allowed);
        if (date != null) { sql.append(" and operational_date=?"); args.add(date); }
        if (seller != null) { sql.append(" and seller_id=?"); args.add(seller); }
        if (status != null) { sql.append(" and status=?"); args.add(status); }
        return new Filter(sql.toString(), List.copyOf(args));
    }
    private record Filter(String sql, List<Object> arguments) { }

    @Override public void replacePointsAndVersion(Route route, long expectedVersion) {
        if (jdbc.update("update route set updated_at=?,version=? where tenant_id=? and id=? and version=?", Timestamp.from(route.updatedAt()),route.version(),route.tenantId(),route.id(),expectedVersion)!=1) throw new IllegalStateException("route version changed");
        int offset=route.points().size()+1;
        jdbc.update("update route_point set sequence=sequence+? where tenant_id=? and route_id=?",offset,route.tenantId(),route.id());
        for(Route.Point point:route.points()) jdbc.update("update route_point set sequence=?,planned_arrival_at=?,planned_departure_at=? where tenant_id=? and route_id=? and id=?",point.sequence(),timestamp(point.plannedArrivalAt()),timestamp(point.plannedDepartureAt()),route.tenantId(),route.id(),point.id());
    }

    private static Timestamp timestamp(Instant value) { return value == null ? null : Timestamp.from(value); }

    @Override
    public Reservation reservePublicationIdempotency(UUID tenant, UUID actor, UUID key, String fingerprint, Instant now) {
        int inserted = jdbc.update("insert into route_idempotency(tenant_id,actor_id,operation,idempotency_key,request_fingerprint,recorded_at,status) values(?,?, 'PUBLISH',?,?,?,'PENDING') on conflict (tenant_id,actor_id,operation,idempotency_key) do nothing", tenant, actor, key, fingerprint, Timestamp.from(now));
        if (inserted == 1) return new Reservation(true, null, fingerprint);
        Reservation result = jdbc.query("select route_id,request_fingerprint from route_idempotency where tenant_id=? and actor_id=? and operation='PUBLISH' and idempotency_key=? and status='COMPLETED'", rs -> rs.next() ? new Reservation(false, rs.getObject(1, UUID.class), rs.getString(2)) : null, tenant, actor, key);
        if (result == null) throw new IllegalStateException("idempotency reservation is not complete");
        return result;
    }

    @Override
    public void completePublicationIdempotency(UUID tenant, UUID actor, UUID key, UUID route) {
        jdbc.update("update route_idempotency set route_id=?,status='COMPLETED' where tenant_id=? and actor_id=? and operation='PUBLISH' and idempotency_key=? and status='PENDING'", route, tenant, actor, key);
    }

    @Override
    public void publish(Route route, long expectedVersion) {
        try { if (jdbc.update("update route set status='PUBLISHED',updated_at=?,version=? where tenant_id=? and id=? and status='DRAFT' and version=?", Timestamp.from(route.updatedAt()), route.version(), route.tenantId(), route.id(), expectedVersion) != 1) throw new IllegalStateException("route state changed"); }
        catch (DuplicateKeyException ex) { throw new RouteStore.Conflict(); }
    }

    @Override public Reservation reserveReassignmentIdempotency(UUID tenant, UUID actor, UUID key, String fingerprint, Instant now) {
        int inserted = jdbc.update("insert into route_idempotency(tenant_id,actor_id,operation,idempotency_key,request_fingerprint,recorded_at,status) values(?,?, 'REASSIGN',?,?,?,'PENDING') on conflict (tenant_id,actor_id,operation,idempotency_key) do nothing", tenant, actor, key, fingerprint, Timestamp.from(now));
        if (inserted == 1) return new Reservation(true, null, fingerprint);
        Reservation result = jdbc.query("select route_id,request_fingerprint from route_idempotency where tenant_id=? and actor_id=? and operation='REASSIGN' and idempotency_key=? and status='COMPLETED'", rs -> rs.next() ? new Reservation(false, rs.getObject(1, UUID.class), rs.getString(2)) : null, tenant, actor, key);
        if (result == null) throw new IllegalStateException("idempotency reservation is not complete");
        return result;
    }

    @Override public void completeReassignmentIdempotency(UUID tenant, UUID actor, UUID key, UUID route) {
        jdbc.update("update route_idempotency set route_id=?,status='COMPLETED' where tenant_id=? and actor_id=? and operation='REASSIGN' and idempotency_key=? and status='PENDING'", route, tenant, actor, key);
    }

    @Override public void reassign(Route route, long expectedVersion) {
        try { if (jdbc.update("update route set seller_id=?,updated_at=?,version=? where tenant_id=? and id=? and status='PUBLISHED' and version=?", route.sellerId(), Timestamp.from(route.updatedAt()), route.version(), route.tenantId(), route.id(), expectedVersion) != 1) throw new IllegalStateException("route state changed"); }
        catch (DuplicateKeyException ex) { throw new RouteStore.Conflict(); }
    }

    @Override public Reservation reserveCopyIdempotency(UUID tenant, UUID actor, UUID key, String fingerprint, Instant now) {
        int inserted = jdbc.update("insert into route_idempotency(tenant_id,actor_id,operation,idempotency_key,request_fingerprint,recorded_at,status) values(?,?, 'COPY',?,?,?,'PENDING') on conflict (tenant_id,actor_id,operation,idempotency_key) do nothing", tenant, actor, key, fingerprint, Timestamp.from(now));
        if (inserted == 1) return new Reservation(true, null, fingerprint);
        Reservation result = jdbc.query("select route_id,request_fingerprint from route_idempotency where tenant_id=? and actor_id=? and operation='COPY' and idempotency_key=? and status='COMPLETED'", rs -> rs.next() ? new Reservation(false, rs.getObject(1, UUID.class), rs.getString(2)) : null, tenant, actor, key);
        if (result == null) throw new IllegalStateException("idempotency request pending");
        return result;
    }

    @Override public void completeCopyIdempotency(UUID tenant, UUID actor, UUID key, UUID route) {
        jdbc.update("update route_idempotency set route_id=?,status='COMPLETED' where tenant_id=? and actor_id=? and operation='COPY' and idempotency_key=? and status='PENDING'", route, tenant, actor, key);
    }
}
