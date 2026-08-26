package com.nahui.followupbussiness.routing.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteStore;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class JdbcRouteStoreIdempotencyIntegrationTest {
    static final PostgreSQLContainer DB = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    JdbcTemplate jdbc;

    @BeforeAll static void start() { DB.start(); }
    @AfterAll static void stop() { DB.stop(); }

    @BeforeEach void migrate() {
        var dataSource = new DriverManagerDataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        var flyway = Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(false).load();
        flyway.clean(); flyway.migrate(); jdbc = new JdbcTemplate(dataSource);
    }

    @Test void separatesCreateAndPublishReservationsForSameKeyAndPreservesCreateReplayAndCollision() {
        UUID tenant = UUID.randomUUID(), actor = account(tenant), seller = UUID.randomUUID(), route = UUID.randomUUID(), key = UUID.randomUUID();
        jdbc.update("insert into workforce_seller(id,tenant_id,user_id,display_name,email,status,created_at,updated_at,version) values(?,?,?,'Seller','seller@example.test','ACTIVE',current_timestamp,current_timestamp,1)", seller, tenant, actor);
        jdbc.update("insert into route(id,tenant_id,operational_date,seller_id,status,created_at,updated_at,version) values(?,?,current_date,?,'DRAFT',current_timestamp,current_timestamp,1)", route, tenant, seller);
        var store = new JdbcRouteStore(jdbc); Instant now = Instant.parse("2026-09-01T12:00:00Z");

        assertThat(store.reserveIdempotency(tenant, actor, key, "create-fingerprint", now).owner()).isTrue();
        store.completeIdempotency(tenant, actor, key, route);
        assertThat(store.reservePublicationIdempotency(tenant, actor, key, "publish-fingerprint", now).owner()).isTrue();
        store.completePublicationIdempotency(tenant, actor, key, route);

        var createReplay = store.reserveIdempotency(tenant, actor, key, "create-fingerprint", now);
        var createCollision = store.reserveIdempotency(tenant, actor, key, "different-create-fingerprint", now);
        var publishReplay = store.reservePublicationIdempotency(tenant, actor, key, "publish-fingerprint", now);
        assertThat(createReplay).extracting("owner", "routeId", "fingerprint").containsExactly(false, route, "create-fingerprint");
        assertThat(createCollision).extracting("owner", "routeId", "fingerprint").containsExactly(false, route, "create-fingerprint");
        assertThat(publishReplay).extracting("owner", "routeId", "fingerprint").containsExactly(false, route, "publish-fingerprint");
    }

    @Test void durablePartialIndexRejectsSecondPublishedRouteForSameSellerAndDate() {
        UUID tenant = UUID.randomUUID(), actor = account(tenant), seller = UUID.randomUUID(), first = UUID.randomUUID(), second = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 1);
        jdbc.update("insert into workforce_seller(id,tenant_id,user_id,display_name,email,status,created_at,updated_at,version) values(?,?,?,'Seller','seller@example.test','ACTIVE',current_timestamp,current_timestamp,1)", seller, tenant, actor);
        jdbc.update("insert into route(id,tenant_id,operational_date,seller_id,status,created_at,updated_at,version) values(?,?,?,?,'PUBLISHED',current_timestamp,current_timestamp,1)", first, tenant, date, seller);
        jdbc.update("insert into route(id,tenant_id,operational_date,seller_id,status,created_at,updated_at,version) values(?,?,?,?,'DRAFT',current_timestamp,current_timestamp,1)", second, tenant, date, seller);
        Route candidate = new Route(second, tenant, "Route", date, seller, new GeoPoint(0, 0), List.of(new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 1, new GeoPoint(0, 0))), Instant.EPOCH, Instant.now(), 2, "PUBLISHED");

        assertThatThrownBy(() -> new JdbcRouteStore(jdbc).publish(candidate, 1)).isInstanceOf(RouteStore.Conflict.class);
    }

    private UUID account(UUID tenant) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into tenancy_company(id,status,created_at,updated_at) values(?,'ACTIVE',current_timestamp,current_timestamp)", tenant);
        jdbc.update("insert into identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) values(?,?,?,'SELLER',?,'ACTIVE','Seller',?,current_timestamp,current_timestamp)", id, "seller-" + id, "$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoAA", tenant, "seller-" + id + "@example.test");
        return id;
    }
}
