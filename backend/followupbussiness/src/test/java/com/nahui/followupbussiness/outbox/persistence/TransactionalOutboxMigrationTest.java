package com.nahui.followupbussiness.outbox.persistence;

import com.nahui.followupbussiness.outbox.adapter.out.persistence.JdbcOutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.application.OutboxPublisher;
import com.nahui.followupbussiness.outbox.config.OutboxConfiguration;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import javax.sql.DataSource;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TransactionalOutboxMigrationTest {
    private static final DockerImageName POSTGIS_IMAGE = DockerImageName.parse("postgis/postgis:17-3.5")
            .asCompatibleSubstituteFor("postgres");
    private static PostgreSQLContainer postgres;

    private JdbcTemplate jdbcTemplate;
    private JdbcOutboxStore outboxStore;
    private TransactionTemplate transactionTemplate;

    @BeforeAll
    static void startPostgres() {
        postgres = new PostgreSQLContainer(POSTGIS_IMAGE)
                .withDatabaseName("fieldsales_be055")
                .withUsername("fieldsales_be055")
                .withPassword("BE055_TEST_ONLY_PASSWORD_0123456789");
        postgres.start();
    }

    @AfterAll
    static void stopPostgres() {
        if (postgres != null) {
            postgres.stop();
        }
    }

    @BeforeEach
    void migrateCleanDatabase() {
        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();
        flyway.clean();
        flyway.migrate();
        DataSource dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        jdbcTemplate = new JdbcTemplate(dataSource);
        outboxStore = new JdbcOutboxStore(jdbcTemplate);
        transactionTemplate = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    @Test
    void appendingInsideRolledBackTransactionLeavesNoOutboxEvent() {
        OutboxEvent event = event();

        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(status -> {
            outboxStore.append(event);
            throw new IllegalStateException("force rollback");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox", Long.class)).isZero();
    }

    @Test
    void claimsOnceWithLeaseAndAllowsOnlyTheClaimHolderToComplete() {
        OutboxEvent event = event();
        outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");

        List<ClaimedOutboxEvent> claimed = outboxStore.claimAvailable(now, now.plusSeconds(30), 10);

        assertThat(claimed).hasSize(1);
        ClaimedOutboxEvent claim = claimed.getFirst();
        assertThat(outboxStore.markPublished(event.eventId(), UUID.randomUUID(), now)).isFalse();
        assertThat(outboxStore.markPublished(event.eventId(), claim.leaseToken(), now)).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT status FROM transactional_outbox WHERE event_id = ?", String.class,
                event.eventId())).isEqualTo("PUBLISHED");
    }

    @Test
    void allowsExpiredClaimToBeRecoveredWithoutChangingTheEventIdentity() {
        OutboxEvent event = event();
        outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        ClaimedOutboxEvent first = outboxStore.claimAvailable(now, now.plusSeconds(1), 1).getFirst();

        ClaimedOutboxEvent recovered = outboxStore.claimAvailable(now.plusSeconds(2), now.plusSeconds(32), 1).getFirst();

        assertThat(recovered.event().eventId()).isEqualTo(event.eventId());
        assertThat(recovered.leaseToken()).isNotEqualTo(first.leaseToken());
        assertThat(recovered.attemptCount()).isEqualTo(2);
    }

    @Test
    void expiredEighthAttemptTerminalizesAndDoesNotBlockFollowingReadyEvent() {
        OutboxEvent exhausted = event();
        OutboxEvent following = event();
        outboxStore.append(exhausted);
        outboxStore.append(following);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        jdbcTemplate.update("UPDATE transactional_outbox SET status = 'CLAIMED', attempt_count = 8, lease_token = ?, lease_expires_at = ? WHERE event_id = ?",
                UUID.randomUUID(), java.sql.Timestamp.from(now.minusSeconds(1)), exhausted.eventId());

        assertThat(outboxStore.terminalExpiredLeasesAtMaxAttempts(now)).isEqualTo(1);
        List<ClaimedOutboxEvent> claimed = outboxStore.claimAvailable(now, now.plusSeconds(30), 10);

        assertThat(jdbcTemplate.queryForObject("SELECT status FROM transactional_outbox WHERE event_id = ?", String.class,
                exhausted.eventId())).isEqualTo("TERMINAL");
        assertThat(claimed).extracting(item -> item.event().eventId()).containsExactly(following.eventId());
    }

    @Test
    void outboxConfigurationRegistersBacklogAndOldestPendingGaugesAgainstJdbcStore() {
        outboxStore.append(event());
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        OutboxConfiguration configuration = new OutboxConfiguration();
        OutboxConfiguration.OutboxProperties properties = configuration.outboxProperties();
        OutboxPublisher publisher = new OutboxPublisher(outboxStore, ignored -> { }, java.time.Clock.systemUTC(), new java.util.Random(1));

        configuration.outboxPublishingScheduler(publisher, outboxStore, properties, registry);

        assertThat(registry.find("outbox.backlog").gauge().value()).isEqualTo(1.0);
        assertThat(registry.find("outbox.oldest_pending_age_seconds").gauge().value()).isGreaterThanOrEqualTo(0.0);
    }

    private static OutboxEvent event() {
        return new OutboxEvent(UUID.randomUUID(), "sale.created", 1, Instant.parse("2026-08-01T11:59:00Z"),
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "{\"saleId\":\"test\"}");
    }
}
