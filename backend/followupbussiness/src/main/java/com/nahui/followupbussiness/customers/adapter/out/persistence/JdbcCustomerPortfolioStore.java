package com.nahui.followupbussiness.customers.adapter.out.persistence;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerPortfolioStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.time.Instant;
import java.time.LocalDate;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase.SuggestionCandidate;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * PostgreSQL projection of current customer portfolios; it performs no portfolio mutation.
 */
public final class JdbcCustomerPortfolioStore implements CustomerPortfolioStore {
    private final JdbcTemplate jdbc;

    public JdbcCustomerPortfolioStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Assignment> current(UUID tenantId, UUID customerId) {
        return jdbc.query("select customer_id,seller_id,effective_from,assigned_by,reason,created_at from customer_portfolio_assignment where tenant_id=? and customer_id=? and effective_from<=current_date and (effective_to is null or effective_to>current_date) order by seller_id", (rs, row) -> new Assignment(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getDate(3).toLocalDate(), rs.getObject(4, UUID.class), rs.getString(5), rs.getTimestamp(6).toInstant()), tenantId, customerId);
    }

    @Override
    public Map<UUID, List<Assignment>> current(UUID tenantId, List<UUID> customerIds) {
        if (customerIds.isEmpty()) return Map.of();
        List<Assignment> assignments = jdbc.query(
                "select customer_id,seller_id,effective_from,assigned_by,reason,created_at from customer_portfolio_assignment where tenant_id=? and effective_from<=current_date and (effective_to is null or effective_to>current_date) and customer_id in ("
                        + placeholders(customerIds.size()) + ") order by customer_id,seller_id",
                (rs, row) -> new Assignment(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getDate(3).toLocalDate(), rs.getObject(4, UUID.class), rs.getString(5), rs.getTimestamp(6).toInstant()),
                parameters(tenantId, customerIds));
        return assignments.stream().collect(java.util.stream.Collectors.groupingBy(Assignment::customerId));
    }

    @Override
    public List<HistoryEntry> history(UUID tenantId, UUID customerId) {
        return jdbc.query("select id,customer_id,previous_seller_id,new_seller_id,actor_id,effective_from,reason,recorded_at from customer_portfolio_history where tenant_id=? and customer_id=? order by effective_from desc,recorded_at desc", (rs, row) -> new HistoryEntry(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getObject(3, UUID.class), rs.getObject(4, UUID.class), rs.getObject(5, UUID.class), rs.getDate(6).toLocalDate(), rs.getString(7), rs.getTimestamp(8).toInstant()), tenantId, customerId);
    }

    @Override
    public void lock(UUID tenantId, UUID customerId) {
        jdbc.queryForObject("select id from customer where tenant_id=? and id=? for update", UUID.class, tenantId, customerId);
    }

    @Override
    public boolean hasFutureAssignment(UUID tenantId, UUID customerId) {
        Boolean exists = jdbc.queryForObject("select exists(select 1 from customer_portfolio_assignment where tenant_id=? and customer_id=? and effective_from>current_date)", Boolean.class, tenantId, customerId);
        return Boolean.TRUE.equals(exists);
    }

    @Override
    public void replace(UUID tenantId, UUID customerId, Set<UUID> sellerIds, UUID actorId, LocalDate effectiveFrom, String reason, Instant now) {
        Set<UUID> before = current(tenantId, customerId).stream().map(Assignment::sellerId).collect(java.util.stream.Collectors.toSet());
        List<UUID> removed = before.stream().filter(id -> !sellerIds.contains(id)).sorted().toList();
        List<UUID> added = sellerIds.stream().filter(id -> !before.contains(id)).sorted().toList();
        if (effectiveFrom.isAfter(LocalDate.now(java.time.ZoneOffset.UTC))) {
            jdbc.update("update customer_portfolio_assignment set effective_to=? where tenant_id=? and customer_id=? and effective_from<? and (effective_to is null or effective_to>?)", effectiveFrom, tenantId, customerId, effectiveFrom, effectiveFrom);
        } else {
            jdbc.update("delete from customer_portfolio_assignment where tenant_id=? and customer_id=?", tenantId, customerId);
        }
        int paired = Math.min(removed.size(), added.size());
        for (int index = 0; index < paired; index++)
            history(tenantId, customerId, removed.get(index), added.get(index), actorId, effectiveFrom, reason, now);
        for (int index = paired; index < removed.size(); index++)
            history(tenantId, customerId, removed.get(index), null, actorId, effectiveFrom, reason, now);
        for (int index = paired; index < added.size(); index++)
            history(tenantId, customerId, null, added.get(index), actorId, effectiveFrom, reason, now);
        for (UUID seller : sellerIds) {
            jdbc.update("insert into customer_portfolio_assignment(tenant_id,customer_id,seller_id,effective_from,assigned_by,reason,created_at) values(?,?,?,?,?,?,?)", tenantId, customerId, seller, effectiveFrom, actorId, reason, java.sql.Timestamp.from(now));
        }
    }

    @Override
    public IdempotencyReservation reserveIdempotency(UUID tenantId, UUID key, String fingerprint, Instant now) {
        int inserted = jdbc.update("insert into customer_portfolio_assignment_idempotency(tenant_id,idempotency_key,request_fingerprint,results,recorded_at,status) values(?,?,?,ARRAY[]::text[],?, 'PENDING') on conflict (tenant_id,idempotency_key) do nothing", tenantId, key, fingerprint, java.sql.Timestamp.from(now));
        if (inserted == 1) return new IdempotencyReservation(true, null);
        IdempotencyRecord record = jdbc.query("select request_fingerprint,results from customer_portfolio_assignment_idempotency where tenant_id=? and idempotency_key=? and status='COMPLETED'", rs -> rs.next() ? new IdempotencyRecord(rs.getString(1), List.of((String[]) rs.getArray(2).getArray())) : null, tenantId, key);
        if (record == null) throw new IllegalStateException("idempotency reservation is not complete");
        return new IdempotencyReservation(false, record);
    }

    @Override
    public void completeIdempotency(UUID tenantId, UUID key, List<String> results) {
        jdbc.update("update customer_portfolio_assignment_idempotency set results=?, status='COMPLETED' where tenant_id=? and idempotency_key=? and status='PENDING'", results.toArray(new String[0]), tenantId, key);
    }

    private void history(UUID tenantId, UUID customerId, UUID previous, UUID next, UUID actorId, LocalDate effectiveFrom, String reason, Instant now) {
        jdbc.update("insert into customer_portfolio_history(id,tenant_id,customer_id,previous_seller_id,new_seller_id,actor_id,effective_from,reason,recorded_at) values(?,?,?,?,?,?,?,?,?)", UUID.randomUUID(), tenantId, customerId, previous, next, actorId, effectiveFrom, reason, java.sql.Timestamp.from(now));
    }

    @Override
    public List<Customer> list(CustomerPortfolioReadUseCase.Query q, CustomerPortfolioReadUseCase.Scope scope) {
        Sql sql = sql(q, scope);
        return jdbc.query("select c.id,c.tenant_id,c.name,c.document_type,c.document_number,c.phone,c.email,c.segment,c.address,ST_Y(c.location),ST_X(c.location),c.visit_frequency_days,c.territory_id,c.status,c.created_at,c.updated_at,c.version " + sql.where + " order by c.name,c.id offset ? limit ?", (rs, row) -> new Customer(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9), new GeoPoint(rs.getDouble(10), rs.getDouble(11)), (Integer) rs.getObject(12), rs.getObject(13, UUID.class), rs.getString(14), rs.getTimestamp(15).toInstant(), rs.getTimestamp(16).toInstant(), rs.getLong(17)), parameters(sql, q, scope, true));
    }

    @Override
    public long count(CustomerPortfolioReadUseCase.Query q, CustomerPortfolioReadUseCase.Scope scope) {
        Sql sql = sql(q, scope);
        Long total = jdbc.queryForObject("select count(*) " + sql.where, Long.class, parameters(sql, q, scope, false));
        return total == null ? 0 : total;
    }

    @Override
    public List<Customer> activeAssignedToSellerAt(UUID tenantId, UUID sellerId, List<UUID> customerIds, LocalDate operationalDate) {
        if (customerIds.isEmpty()) return List.of();
        return jdbc.query("select c.id,c.tenant_id,c.name,c.document_type,c.document_number,c.phone,c.email,c.segment,c.address,ST_Y(c.location),ST_X(c.location),c.visit_frequency_days,c.territory_id,c.status,c.created_at,c.updated_at,c.version from customer c where c.tenant_id=? and c.status='ACTIVE' and c.id in (" + placeholders(customerIds.size()) + ") and exists (select 1 from customer_portfolio_assignment p where p.tenant_id=c.tenant_id and p.customer_id=c.id and p.seller_id=? and p.effective_from<=? and (p.effective_to is null or p.effective_to>?))", (rs, row) -> new Customer(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9), new GeoPoint(rs.getDouble(10), rs.getDouble(11)), (Integer) rs.getObject(12), rs.getObject(13, UUID.class), rs.getString(14), rs.getTimestamp(15).toInstant(), rs.getTimestamp(16).toInstant(), rs.getLong(17)), parameters(tenantId, customerIds, sellerId, operationalDate));
    }

    @Override
    public List<SuggestionCandidate> suggestedForSeller(UUID tenantId, UUID sellerId) {
        return jdbc.query("select c.id,c.tenant_id,c.name,c.document_type,c.document_number,c.phone,c.email,c.segment,c.address,ST_Y(c.location),ST_X(c.location),c.visit_frequency_days,c.territory_id,c.status,c.created_at,c.updated_at,c.version,a.last_completed_visit_at from customer c left join customer_activity_fact a on a.tenant_id=c.tenant_id and a.customer_id=c.id where c.tenant_id=? and c.status='ACTIVE' and exists (select 1 from customer_portfolio_assignment p where p.tenant_id=c.tenant_id and p.customer_id=c.id and p.seller_id=? and p.effective_from<=current_date and (p.effective_to is null or p.effective_to>current_date))", (rs, row) -> new SuggestionCandidate(new Customer(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9), new GeoPoint(rs.getDouble(10), rs.getDouble(11)), (Integer) rs.getObject(12), rs.getObject(13, UUID.class), rs.getString(14), rs.getTimestamp(15).toInstant(), rs.getTimestamp(16).toInstant(), rs.getLong(17)), rs.getTimestamp(18) == null ? null : rs.getTimestamp(18).toInstant()), tenantId, sellerId);
    }

    private Sql sql(CustomerPortfolioReadUseCase.Query q, CustomerPortfolioReadUseCase.Scope scope) {
        String portfolio = scope.allCurrentPortfolios() ? "" : " and exists (select 1 from customer_portfolio_assignment p where p.tenant_id=c.tenant_id and p.customer_id=c.id and p.effective_from<=current_date and (p.effective_to is null or p.effective_to>current_date) and p.seller_id in (" + placeholders(scope.sellerIds().size()) + "))";
        String activity = (q.withoutVisitSince() == null ? "" : " and (not exists (select 1 from customer_activity_fact av where av.tenant_id=c.tenant_id and av.customer_id=c.id) or (select av.last_completed_visit_at from customer_activity_fact av where av.tenant_id=c.tenant_id and av.customer_id=c.id) is null or (select av.last_completed_visit_at from customer_activity_fact av where av.tenant_id=c.tenant_id and av.customer_id=c.id) < ?)")
                + (q.withoutPurchaseSince() == null ? "" : " and (not exists (select 1 from customer_activity_fact ap where ap.tenant_id=c.tenant_id and ap.customer_id=c.id) or (select ap.last_confirmed_purchase_at from customer_activity_fact ap where ap.tenant_id=c.tenant_id and ap.customer_id=c.id) is null or (select ap.last_confirmed_purchase_at from customer_activity_fact ap where ap.tenant_id=c.tenant_id and ap.customer_id=c.id) < ?)");
        String requestedSeller = q.sellerId() == null ? "" : " and exists (select 1 from customer_portfolio_assignment requested where requested.tenant_id=c.tenant_id and requested.customer_id=c.id and requested.effective_from<=current_date and (requested.effective_to is null or requested.effective_to>current_date) and requested.seller_id=?) and exists (select 1 from workforce_seller seller join workforce_seller_territory seller_territory on seller_territory.seller_id=seller.id join workforce_territory territory on territory.id=seller_territory.territory_id and territory.tenant_id=seller.tenant_id where seller.tenant_id=c.tenant_id and seller.id=? and seller.status='ACTIVE' and territory.status='ACTIVE' and territory.id=c.territory_id)";
        return new Sql("from customer c where c.tenant_id=?" + portfolio + " and (?::text is null or lower(c.name) like lower(?) or lower(coalesce(c.segment,'')) like lower(?) or lower(coalesce(c.document_number,'')) like lower(?) or lower(coalesce(c.phone,'')) like lower(?) or lower(c.address) like lower(?)) and (?::text is null or c.status=?) and (?::uuid is null or c.territory_id=?) and (?::text is null or c.segment=?)" + requestedSeller + activity);
    }

    private Object[] parameters(Sql sql, CustomerPortfolioReadUseCase.Query q, CustomerPortfolioReadUseCase.Scope scope, boolean paged) {
        java.util.ArrayList<Object> p = new java.util.ArrayList<>();
        p.add(scope.tenantId());
        if (!scope.allCurrentPortfolios()) p.addAll(scope.sellerIds());
        String pattern = q.search() == null || q.search().isBlank() ? null : "%" + q.search().trim() + "%";
        p.add(pattern);
        p.add(pattern);
        p.add(pattern);
        p.add(pattern);
        p.add(pattern);
        p.add(pattern);
        p.add(q.status());
        p.add(q.status());
        p.add(q.territoryId());
        p.add(q.territoryId());
        p.add(q.segment());
        p.add(q.segment());
        if (q.sellerId() != null) { p.add(q.sellerId()); p.add(q.sellerId()); }
        if (q.withoutVisitSince() != null)
            p.add(java.sql.Timestamp.from(q.withoutVisitSince().atStartOfDay(java.time.ZoneOffset.UTC).toInstant()));
        if (q.withoutPurchaseSince() != null)
            p.add(java.sql.Timestamp.from(q.withoutPurchaseSince().atStartOfDay(java.time.ZoneOffset.UTC).toInstant()));
        if (paged) {
            p.add(q.offset());
            p.add(q.limit());
        }
        return p.toArray();
    }

    private record Sql(String where) {
    }

    private static String placeholders(int count) {
        return String.join(",", java.util.Collections.nCopies(count, "?"));
    }

    private static Object[] parameters(UUID tenantId, List<UUID> customerIds) {
        java.util.ArrayList<Object> parameters = new java.util.ArrayList<>();
        parameters.add(tenantId);
        parameters.addAll(customerIds);
        return parameters.toArray();
    }

    private static Object[] parameters(UUID tenantId, List<UUID> customerIds, UUID sellerId, LocalDate operationalDate) {
        java.util.ArrayList<Object> parameters = new java.util.ArrayList<>();
        parameters.add(tenantId);
        parameters.addAll(customerIds);
        parameters.add(sellerId);
        parameters.add(operationalDate);
        parameters.add(operationalDate);
        return parameters.toArray();
    }
}
