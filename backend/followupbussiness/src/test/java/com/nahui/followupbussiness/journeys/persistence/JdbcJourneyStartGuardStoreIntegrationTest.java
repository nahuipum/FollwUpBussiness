package com.nahui.followupbussiness.journeys.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.journeys.adapter.out.persistence.JdbcJourneyStartGuardStore;
import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import java.time.*;
import java.util.UUID;
import java.util.concurrent.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class JdbcJourneyStartGuardStoreIntegrationTest {
    static final PostgreSQLContainer DB = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    DriverManagerDataSource dataSource;
    JdbcTemplate jdbc;
    TransactionTemplate transactions;

    @BeforeAll static void start() { DB.start(); }
    @AfterAll static void stop() { DB.stop(); }

    @BeforeEach void migrate() {
        dataSource = new DriverManagerDataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        Flyway flyway = Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(false).load();
        flyway.clean(); flyway.migrate();
        jdbc = new JdbcTemplate(dataSource);
        transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    @Test void isolatesTenantAndReadsOnlyTheExactGuard() {
        UUID seller = UUID.randomUUID();
        LocalDate date = LocalDate.parse("2026-08-26");
        JourneyStartedStatusUseCase.Query first = new JourneyStartedStatusUseCase.Query(UUID.randomUUID(), seller, date);
        JourneyStartedStatusUseCase.Query second = new JourneyStartedStatusUseCase.Query(UUID.randomUUID(), seller, date);
        JdbcJourneyStartGuardStore store = new JdbcJourneyStartGuardStore(jdbc);

        transactions.executeWithoutResult(status -> {
            assertThat(store.stateForUpdate(first)).isEqualTo(JourneyStartedStatusUseCase.State.NOT_STARTED);
            store.markStarted(first, Instant.parse("2026-08-26T08:00:00Z"));
        });
        JourneyStartedStatusUseCase.State firstState = transactions.execute(status -> store.stateForUpdate(first));
        JourneyStartedStatusUseCase.State secondState = transactions.execute(status -> store.stateForUpdate(second));
        assertThat(firstState).isEqualTo(JourneyStartedStatusUseCase.State.STARTED);
        assertThat(secondState).isEqualTo(JourneyStartedStatusUseCase.State.NOT_STARTED);
        assertThat(jdbc.queryForObject("select count(*) from journey_start_guard where seller_id=? and business_date=?", Integer.class, seller, date)).isEqualTo(2);
    }

    @Test void keepsTheSameTripleLockedUntilTheCallingTransactionCompletes() throws Exception {
        JourneyStartedStatusUseCase.Query query = new JourneyStartedStatusUseCase.Query(UUID.randomUUID(), UUID.randomUUID(), LocalDate.parse("2026-08-26"));
        CountDownLatch firstLocked = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<JourneyStartedStatusUseCase.State> first = pool.submit(() -> transactions.execute(status -> {
                JourneyStartedStatusUseCase.State state = new JdbcJourneyStartGuardStore(new JdbcTemplate(dataSource)).stateForUpdate(query);
                firstLocked.countDown();
                try {
                    if (!releaseFirst.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("test lock timeout");
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("test lock interrupted", exception);
                }
                return state;
            }));
            assertThat(firstLocked.await(10, TimeUnit.SECONDS)).isTrue();
            Future<JourneyStartedStatusUseCase.State> second = pool.submit(() -> transactions.execute(status -> new JdbcJourneyStartGuardStore(new JdbcTemplate(dataSource)).stateForUpdate(query)));
            Thread.sleep(250);
            assertThat(second.isDone()).isFalse();
            releaseFirst.countDown();
            assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo(JourneyStartedStatusUseCase.State.NOT_STARTED);
            assertThat(second.get(10, TimeUnit.SECONDS)).isEqualTo(JourneyStartedStatusUseCase.State.NOT_STARTED);
        } finally {
            releaseFirst.countDown();
            pool.shutdownNow();
        }
    }

    @Test void rejectsMarkStartedWithoutTheTransactionThatAcquiredTheGuardAndKeepsItNotStarted() {
        JourneyStartedStatusUseCase.Query query = new JourneyStartedStatusUseCase.Query(UUID.randomUUID(), UUID.randomUUID(), LocalDate.parse("2026-08-26"));
        JdbcJourneyStartGuardStore store = new JdbcJourneyStartGuardStore(jdbc);
        transactions.executeWithoutResult(status -> assertThat(store.stateForUpdate(query)).isEqualTo(JourneyStartedStatusUseCase.State.NOT_STARTED));

        assertThatThrownBy(() -> store.markStarted(query, Instant.parse("2026-08-26T08:00:00Z")))
                .isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("select started_at is null from journey_start_guard where tenant_id=? and seller_id=? and business_date=?", Boolean.class,
                query.tenantId(), query.sellerId(), query.businessDate())).isTrue();
    }
}
