package com.nahui.followupbussiness.outbox.persistence;

import com.nahui.followupbussiness.outbox.adapter.out.persistence.JdbcOutboxStore;
import com.nahui.followupbussiness.outbox.domain.ClaimedOutboxEvent;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.application.OutboxPublisher;
import com.nahui.followupbussiness.outbox.application.PlatformOperator;
import com.nahui.followupbussiness.outbox.application.ReprocessOutboxEvent;
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
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.time.Clock;
import java.time.ZoneOffset;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

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
                .withDatabaseName("followupbussiness_be055")
                .withUsername("followupbussiness_be055")
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

        assertThat(outboxStore.moveExpiredLeasesToDlqAtMaxAttempts(now)).isEqualTo(1);
        List<ClaimedOutboxEvent> claimed = outboxStore.claimAvailable(now, now.plusSeconds(30), 10);

        assertThat(jdbcTemplate.queryForObject("SELECT status FROM transactional_outbox WHERE event_id = ?", String.class,
                exhausted.eventId())).isEqualTo("TERMINAL");
        assertThat(claimed).extracting(item -> item.event().eventId()).containsExactly(following.eventId());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq WHERE event_id = ?", Integer.class,
                exhausted.eventId())).isEqualTo(1);
    }

    @Test
    void reprocessesDlqOnlyForPlatformOperatorAndAtMostThreeTimes() {
        OutboxEvent event = event();
        outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        ClaimedOutboxEvent claim = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), claim.leaseToken(), now,
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.PERMANENT, "IllegalArgumentException", "PUBLISH_FAILURE")).isTrue();
        ReprocessOutboxEvent useCase = new ReprocessOutboxEvent(outboxStore, Clock.fixed(now, ZoneOffset.UTC));

        assertThatThrownBy(() -> useCase.execute(event.eventId(), new PlatformOperator(UUID.randomUUID(), false)))
                .isInstanceOf(SecurityException.class);
        UUID firstOperator = UUID.randomUUID();
        assertThat(useCase.execute(event.eventId(), new PlatformOperator(firstOperator, true))).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT status FROM transactional_outbox WHERE event_id = ?", String.class,
                event.eventId())).isEqualTo("PENDING");
        jdbcTemplate.update("UPDATE transactional_outbox SET status = 'TERMINAL', terminal_at = ? WHERE event_id = ?", java.sql.Timestamp.from(now), event.eventId());
        UUID secondOperator = UUID.randomUUID();
        assertThat(useCase.execute(event.eventId(), new PlatformOperator(secondOperator, true))).isTrue();
        jdbcTemplate.update("UPDATE transactional_outbox SET status = 'TERMINAL', terminal_at = ? WHERE event_id = ?", java.sql.Timestamp.from(now), event.eventId());
        UUID thirdOperator = UUID.randomUUID();
        assertThat(useCase.execute(event.eventId(), new PlatformOperator(thirdOperator, true))).isTrue();
        jdbcTemplate.update("UPDATE transactional_outbox SET status = 'TERMINAL', terminal_at = ? WHERE event_id = ?", java.sql.Timestamp.from(now), event.eventId());
        assertThat(useCase.execute(event.eventId(), new PlatformOperator(UUID.randomUUID(), true))).isFalse();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq_reprocess_audit WHERE event_id = ?", Integer.class, event.eventId())).isEqualTo(3);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT operator_id) FROM transactional_outbox_dlq_reprocess_audit WHERE event_id = ?", Integer.class, event.eventId())).isEqualTo(3);
    }

    @Test
    void retentionDeletesExpiredDlqBeforeItsTerminalOutboxEvidence() {
        OutboxEvent event = event(); outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        ClaimedOutboxEvent claim = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        outboxStore.moveToDlq(event.eventId(), claim.leaseToken(), now.minus(java.time.Duration.ofDays(31)),
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.TRANSIENT, "Failure", "PUBLISH_FAILURE");
        assertThat(outboxStore.deleteCompletedBefore(now.minus(java.time.Duration.ofDays(30)))).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq", Integer.class)).isZero();
    }

    @Test
    void keepsReprocessAuditWhenAnEventReturnsToDlqAfterReprocessing() {
        OutboxEvent event = event(); outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        ClaimedOutboxEvent first = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), first.leaseToken(), now,
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.PERMANENT, "FirstFailure", "PUBLISH_FAILURE")).isTrue();
        assertThat(outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now.plusSeconds(1))).isTrue();
        ClaimedOutboxEvent second = outboxStore.claimAvailable(now.plusSeconds(1), now.plusSeconds(31), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), second.leaseToken(), now.plusSeconds(2),
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.TRANSIENT, "SecondFailure", "PUBLISH_FAILURE")).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT reprocess_count FROM transactional_outbox_dlq WHERE event_id = ?", Integer.class, event.eventId())).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT failure_type FROM transactional_outbox_dlq WHERE event_id = ?", String.class, event.eventId())).isEqualTo("SecondFailure");
    }

    @Test
    void retentionPreservesReprocessAuditAndLimitForAnOldDlqEventThatWasRequeued() {
        OutboxEvent event = event();
        outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        Instant expiredDlqEntry = now.minus(java.time.Duration.ofDays(31));

        ClaimedOutboxEvent first = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), first.leaseToken(), expiredDlqEntry,
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.PERMANENT, "FirstFailure", "PUBLISH_FAILURE")).isTrue();
        assertThat(outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now)).isTrue();

        assertThat(outboxStore.deleteCompletedBefore(now.minus(java.time.Duration.ofDays(30)))).isZero();

        ClaimedOutboxEvent second = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), second.leaseToken(), now.plusSeconds(1),
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.TRANSIENT, "SecondFailure", "PUBLISH_FAILURE")).isTrue();
        assertThat(outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now.plusSeconds(2))).isTrue();

        ClaimedOutboxEvent third = outboxStore.claimAvailable(now.plusSeconds(2), now.plusSeconds(32), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), third.leaseToken(), now.plusSeconds(3),
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.PERMANENT, "ThirdFailure", "PUBLISH_FAILURE")).isTrue();
        assertThat(outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now.plusSeconds(4))).isTrue();
        jdbcTemplate.update("UPDATE transactional_outbox SET status = 'TERMINAL', terminal_at = ? WHERE event_id = ?",
                java.sql.Timestamp.from(now.plusSeconds(4)), event.eventId());

        assertThat(outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now.plusSeconds(5))).isFalse();
        assertThat(jdbcTemplate.queryForObject("SELECT reprocess_count FROM transactional_outbox_dlq WHERE event_id = ?", Integer.class,
                event.eventId())).isEqualTo(3);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq_reprocess_audit WHERE event_id = ?", Integer.class,
                event.eventId())).isEqualTo(3);
    }

    @Test
    void retentionDoesNotDeleteAnOldDlqEntryAfterRecentPublication() {
        OutboxEvent event = event();
        outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        ClaimedOutboxEvent claim = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), claim.leaseToken(), now.minus(java.time.Duration.ofDays(31)),
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.PERMANENT, "Failure", "PUBLISH_FAILURE")).isTrue();
        assertThat(outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now)).isTrue();
        ClaimedOutboxEvent requeued = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.markPublished(event.eventId(), requeued.leaseToken(), now)).isTrue();

        assertThat(outboxStore.deleteCompletedBefore(now.minus(java.time.Duration.ofDays(30)))).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq WHERE event_id = ?", Integer.class,
                event.eventId())).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq_reprocess_audit WHERE event_id = ?", Integer.class,
                event.eventId())).isEqualTo(1);
    }

    @Test
    void serializesConcurrentReprocessAndRetentionForTheSameOldDlqEvent() throws Exception {
        OutboxEvent event = event();
        outboxStore.append(event);
        Instant now = Instant.parse("2026-08-01T12:00:00Z");
        ClaimedOutboxEvent claim = outboxStore.claimAvailable(now, now.plusSeconds(30), 1).getFirst();
        assertThat(outboxStore.moveToDlq(event.eventId(), claim.leaseToken(), now.minus(java.time.Duration.ofDays(31)),
                com.nahui.followupbussiness.outbox.domain.PublicationFailureKind.PERMANENT, "Failure", "PUBLISH_FAILURE")).isTrue();

        try (Connection blocker = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             ExecutorService executor = Executors.newFixedThreadPool(2)) {
            blocker.setAutoCommit(false);
            try (PreparedStatement lock = blocker.prepareStatement(
                    "SELECT pg_advisory_xact_lock(hashtextextended(?::text, 0))")) {
                lock.setString(1, event.eventId().toString());
                lock.execute();
            }

            Future<Boolean> reprocessed = executor.submit(() -> outboxStore.reprocessFromDlq(event.eventId(), UUID.randomUUID(), now));
            waitUntilAdvisoryLockIsContended();
            Future<Integer> purged = executor.submit(() -> outboxStore.deleteCompletedBefore(now.minus(java.time.Duration.ofDays(30))));
            blocker.commit();

            assertThat(reprocessed.get(10, TimeUnit.SECONDS)).isTrue();
            assertThat(purged.get(10, TimeUnit.SECONDS)).isZero();
        }

        assertThat(jdbcTemplate.queryForObject("SELECT status FROM transactional_outbox WHERE event_id = ?", String.class,
                event.eventId())).isEqualTo("PENDING");
        assertThat(jdbcTemplate.queryForObject("SELECT reprocess_count FROM transactional_outbox_dlq WHERE event_id = ?", Integer.class,
                event.eventId())).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactional_outbox_dlq_reprocess_audit WHERE event_id = ?", Integer.class,
                event.eventId())).isEqualTo(1);
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

    private void waitUntilAdvisoryLockIsContended() throws InterruptedException {
        for (int attempt = 0; attempt < 100; attempt++) {
            Integer waiting = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event = 'advisory'", Integer.class);
            if (waiting != null && waiting > 0) {
                return;
            }
            Thread.sleep(20);
        }
        throw new AssertionError("The reprocess operation did not contend for the advisory lock");
    }
}
