package com.nahui.followupbussiness.workforce.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class TerritoryUniquenessIntegrationTest {
    static final PostgreSQLContainer DB = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    DriverManagerDataSource ds;
    UUID tenant;

    @BeforeAll
    static void start() {
        DB.start();
    }

    @AfterAll
    static void stop() {
        DB.stop();
    }

    @BeforeEach
    void migrate() {
        ds = new DriverManagerDataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        var f = Flyway.configure().dataSource(ds).locations("classpath:db/migration").cleanDisabled(false).load();
        f.clean();
        f.migrate();
        tenant = UUID.randomUUID();
        new JdbcTemplate(ds).update("insert into tenancy_company(id,status,created_at,updated_at) values(?,'ACTIVE',?,?)", tenant, java.sql.Timestamp.from(Instant.EPOCH), java.sql.Timestamp.from(Instant.EPOCH));
    }

    @Test
    void concurrentCaseVariantsLeaveExactlyOneTerritory() {
        var gate = new CyclicBarrier(2);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Future<Boolean> first = pool.submit(() -> insert("Norte", "NORTE", gate));
            Future<Boolean> second = pool.submit(() -> insert("norte", "norte", gate));
            assertThat((first.get() ? 1 : 0) + (second.get() ? 1 : 0)).isEqualTo(1);
            assertThat(new JdbcTemplate(ds).queryForObject("select count(*) from workforce_territory where tenant_id=?", Integer.class, tenant)).isEqualTo(1);
        } catch (Exception e) {
            throw new AssertionError(e);
        } finally {
            pool.shutdownNow();
        }
    }

    private boolean insert(String name, String code, CyclicBarrier gate) {
        try {
            gate.await();
            new JdbcTemplate(ds).update("insert into workforce_territory(id,tenant_id,name,code,status,created_at,updated_at,version) values(?,?,?,?, 'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)", UUID.randomUUID(), tenant, name, code);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
