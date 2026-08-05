package com.nahui.followupbussiness.audit.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.application.PurgeAuditRetention;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class AuditEntryMigrationTest {
    private static final DockerImageName POSTGIS_IMAGE = DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres");
    private static PostgreSQLContainer postgres;
    private JdbcTemplate jdbc;
    private JdbcAuditEntryStore store;

    @BeforeAll static void startPostgres() {
        postgres = new PostgreSQLContainer(POSTGIS_IMAGE).withDatabaseName("followupbussiness_be051")
                .withUsername("followupbussiness_be051").withPassword("BE051_TEST_ONLY_PASSWORD_0123456789");
        postgres.start();
    }
    @AfterAll static void stopPostgres() { if (postgres != null) postgres.stop(); }
    @BeforeEach void migrateCleanDatabase() {
        Flyway flyway = Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration").cleanDisabled(false).load();
        flyway.clean(); flyway.migrate();
        jdbc = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()));
        store = new JdbcAuditEntryStore(jdbc, jdbc);
    }

    @Test void appendsOnlyOnceForTheSameIdAndPersistsTenantScopedEvidence() {
        AuditEntry entry = entry(Instant.parse("2025-08-04T12:00:00Z"));
        assertThat(store.append(entry)).isTrue();
        assertThat(store.append(entry)).isFalse();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry WHERE tenant_id = ? AND resource_id = ?", Integer.class,
                entry.tenantId(), entry.resourceId())).isEqualTo(1);
    }

    @Test void concurrentRetriesOfTheSameAuditIdCreateOnlyOneEntry() throws Exception {
        AuditEntry entry = entry(Instant.parse("2026-08-04T12:00:00Z"));
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<Boolean> first = executor.submit(() -> store.append(entry));
            Future<Boolean> second = executor.submit(() -> store.append(entry));
            assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS))).containsExactlyInAnyOrder(true, false);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry WHERE id = ?", Integer.class, entry.id())).isEqualTo(1);
    }

    @Test void retentionKeepsCutoffAndPurgesNetworkBeforeEntriesInBoundedBatches() {
        Instant now = Instant.parse("2026-08-04T12:00:00Z");
        AuditEntry networkExpired = entry(now.minus(java.time.Duration.ofDays(91)));
        AuditEntry entryExpired = entry(now.minus(java.time.Duration.ofDays(366)));
        AuditEntry atCutoff = entry(now.minus(java.time.Duration.ofDays(364)));
        store.append(networkExpired); store.append(entryExpired); store.append(atCutoff);
        jdbc.update("INSERT INTO audit_network_context(id, audit_entry_id, tenant_id, ip_address, occurred_at) VALUES (?, ?, ?, CAST(? AS inet), ?)",
                UUID.randomUUID(), networkExpired.id(), networkExpired.tenantId(), "192.0.2.1", java.sql.Timestamp.from(networkExpired.occurredAt()));
        PurgeAuditRetention.PurgeResult result = new PurgeAuditRetention(store, Clock.fixed(now, ZoneOffset.UTC)).purge();
        assertThat(result.networkContextsDeleted()).isEqualTo(1);
        assertThat(result.entriesDeleted()).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry WHERE id = ?", Integer.class, atCutoff.id())).isEqualTo(1);
        assertThat(new PurgeAuditRetention(store, Clock.fixed(now, ZoneOffset.UTC)).purge().entriesDeleted()).isZero();
    }

    @Test void writerCannotReadNetworkOrMutateEvidenceAndPurgerCannotDeleteDirectly() throws Exception {
        try (Connection writer = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Connection purger = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())) {
            writer.createStatement().execute("SET ROLE audit_writer");
            assertThatThrownBy(() -> writer.createStatement().executeQuery("SELECT * FROM audit_network_context"))
                    .isInstanceOf(SQLException.class);
            assertThatThrownBy(() -> writer.createStatement().executeUpdate("DELETE FROM audit_entry"))
                    .isInstanceOf(SQLException.class);
            purger.createStatement().execute("SET ROLE audit_purger");
            assertThat(purger.createStatement().executeQuery("SELECT audit_purge_entries()").next()).isTrue();
            assertThatThrownBy(() -> purger.createStatement().executeQuery("SELECT audit_purge_entries('infinity', 501)"))
                    .isInstanceOf(SQLException.class);
            assertThatThrownBy(() -> purger.createStatement().executeUpdate("DELETE FROM audit_entry"))
                    .isInstanceOf(SQLException.class);
        }
    }

    @Test void dedicatedLoginIdentitiesUseTheirOwnDatasourceForAppendAndPurge() throws Exception {
        jdbc.execute("DROP ROLE IF EXISTS audit_writer_runtime");
        jdbc.execute("DROP ROLE IF EXISTS audit_purger_runtime");
        jdbc.execute("CREATE ROLE audit_writer_runtime LOGIN PASSWORD 'BE051_WRITER_TEST_ONLY_0123456789'");
        jdbc.execute("CREATE ROLE audit_purger_runtime LOGIN PASSWORD 'BE051_PURGER_TEST_ONLY_0123456789'");
        jdbc.execute("GRANT audit_writer TO audit_writer_runtime");
        jdbc.execute("GRANT audit_purger TO audit_purger_runtime");
        JdbcTemplate writer = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), "audit_writer_runtime", "BE051_WRITER_TEST_ONLY_0123456789"));
        JdbcTemplate purger = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), "audit_purger_runtime", "BE051_PURGER_TEST_ONLY_0123456789"));
        JdbcAuditEntryStore dedicated = new JdbcAuditEntryStore(writer, purger);
        AuditEntry entry = entry(Instant.parse("2025-08-04T12:00:00Z"));
        assertThat(writer.queryForObject("SELECT current_user", String.class)).isEqualTo("audit_writer_runtime");
        assertThat(purger.queryForObject("SELECT current_user", String.class)).isEqualTo("audit_purger_runtime");
        assertThat(dedicated.append(entry)).isTrue();
        assertThat(dedicated.deleteEntriesBefore(Instant.parse("2026-08-04T12:00:00Z"), 500)).isEqualTo(1);
        assertThatThrownBy(() -> writer.queryForObject("SELECT * FROM audit_network_context", Object.class)).isInstanceOf(Exception.class);
        assertThatThrownBy(() -> purger.update("DELETE FROM audit_entry")).isInstanceOf(Exception.class);
    }

    private static AuditEntry entry(Instant occurredAt) {
        return new AuditEntry(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), AuditAction.CRITICAL_MUTATION,
                "CUSTOMER", UUID.randomUUID(), AuditResult.SUCCESS, UUID.randomUUID(), "OWN_RESOURCE",
                Map.of("status", "PENDING"), Map.of("status", "APPROVED"), occurredAt);
    }
}
