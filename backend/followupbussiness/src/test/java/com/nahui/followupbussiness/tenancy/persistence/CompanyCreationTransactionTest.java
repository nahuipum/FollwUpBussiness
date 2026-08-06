package com.nahui.followupbussiness.tenancy.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.application.PlatformAuditTrustedContext;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAudit;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAudit;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.out.PlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextPlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextCompanyDenialAuditTrustedContextProvider;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyCreationStore;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyCommand;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyService;
import com.nahui.followupbussiness.tenancy.config.TenancyConfiguration;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CompanyCreationTransactionTest {
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbc; private DriverManagerDataSource dataSource;
    @BeforeAll static void start() { postgres.start(); }
    @AfterAll static void stop() { postgres.stop(); }
    @BeforeEach void migrate() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").cleanDisabled(false).load().clean();
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").load().migrate();
        dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()); jdbc = new JdbcTemplate(dataSource);
    }
    @Test void commitsCompanySettingsAndPlatformAuditInOneTransaction() {
        execute(audit());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company_settings", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE scope = 'PLATFORM' AND tenant_id IS NULL", Integer.class)).isEqualTo(1);
    }
    @Test void rollsBackCompanyAndSettingsWhenAuditFails() {
        RecordPlatformCompanyAuditUseCase failing = command -> { throw new IllegalStateException("audit unavailable"); };
        assertThatThrownBy(() -> execute(failing)).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company_settings", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry", Integer.class)).isZero();
    }
    @Test void persistsTheNormalizedRequestCorrelationInThePlatformAudit() {
        UUID correlation = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("com.nahui.followupbussiness.request.correlationId", correlation);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        AuthenticatedActor actor = actor();
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(actor, "token", java.util.List.of()));
        try {
            new RecordPlatformCompanyAudit(new JdbcAuditEntryStore(jdbc, jdbc), new SecurityContextPlatformAuditTrustedContextProvider(Clock.systemUTC()))
                    .record(new com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand(UUID.randomUUID(),
                            com.nahui.followupbussiness.audit.domain.AuditResult.SUCCESS));
            assertThat(jdbc.queryForObject("SELECT correlation_id FROM audit_entry", UUID.class)).isEqualTo(correlation);
        } finally {
            RequestContextHolder.resetRequestAttributes();
            SecurityContextHolder.clearContext();
        }
    }
    @Test void tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany() {
        UUID tenant = UUID.randomUUID(); UUID correlation = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest(); request.setAttribute("com.nahui.followupbussiness.request.correlationId", correlation);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        AuthenticatedActor actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.PLATFORM_SUPERADMIN);
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(actor, "token", java.util.List.of()));
        try {
            assertThatThrownBy(() -> transactionalService(audit(), denialAudit()).execute(command(), actor)).isInstanceOf(CreateCompanyService.AccessDeniedException.class);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company", Integer.class)).isZero();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE scope='TENANT_BOUND_DENIAL' AND tenant_id=? AND actor_id=? AND result='DENIED' AND correlation_id=?", Integer.class, tenant, actor.accountId(), correlation)).isEqualTo(1);
        } finally { RequestContextHolder.resetRequestAttributes(); SecurityContextHolder.clearContext(); }
    }
    @Test void tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited() {
        AuthenticatedActor actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN);
        assertThatThrownBy(() -> transactionalService(audit(), command -> { throw new IllegalStateException("audit unavailable"); }).execute(command(), actor))
                .isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company_settings", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry", Integer.class)).isZero();
    }
    @Test void concurrentCreatesOfTheSameCodeProduceOneCompanyAndOneConflict() throws Exception {
        RecordPlatformCompanyAuditUseCase audit = audit(); CountDownLatch gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> concurrentCreate(audit, gate)); var second = pool.submit(() -> concurrentCreate(audit, gate)); gate.countDown();
            assertThat(List.of(first.get(), second.get())).containsExactlyInAnyOrder(false, true);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company_settings", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE scope='PLATFORM'", Integer.class)).isEqualTo(2);
    }
    @Test void usesTheInjectedTenancyTransactionManagerForTheAtomicCreationPath() {
        TrackingTransactionManager transactionManager = new TrackingTransactionManager(dataSource);
        new TenancyConfiguration().createCompanyUseCase(jdbc, transactionManager, audit(), denialAudit()).execute(command(), actor());
        assertThat(transactionManager.transactionsStarted).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tenancy_company", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE scope='PLATFORM'", Integer.class)).isEqualTo(1);
    }
    private CreateCompanyService service(RecordPlatformCompanyAuditUseCase audit) { return new CreateCompanyService(new JdbcCompanyCreationStore(jdbc), audit, command -> { }, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC)); }
    private RecordPlatformCompanyAuditUseCase audit() {
        PlatformAuditTrustedContextProvider context = () -> new PlatformAuditTrustedContext(UUID.randomUUID(), UUID.randomUUID(), Instant.EPOCH);
        return new RecordPlatformCompanyAudit(new JdbcAuditEntryStore(jdbc, jdbc), context);
    }
    private RecordCompanyDenialAuditUseCase denialAudit() {
        return new RecordCompanyDenialAudit(new JdbcAuditEntryStore(jdbc, jdbc), new SecurityContextCompanyDenialAuditTrustedContextProvider(Clock.systemUTC()));
    }
    private void execute(RecordPlatformCompanyAuditUseCase audit) {
        new TransactionTemplate(new DataSourceTransactionManager(dataSource)).executeWithoutResult(status -> service(audit).execute(command(), actor()));
    }
    private com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase transactionalService(RecordPlatformCompanyAuditUseCase audit, RecordCompanyDenialAuditUseCase denialAudit) {
        return new TenancyConfiguration().createCompanyUseCase(jdbc, new DataSourceTransactionManager(dataSource), audit, denialAudit);
    }
    private boolean concurrentCreate(RecordPlatformCompanyAuditUseCase audit, CountDownLatch gate) throws Exception {
        gate.await(); return new TransactionTemplate(new DataSourceTransactionManager(dataSource)).execute(status -> service(audit).execute(command(), actor()).conflict());
    }
    private AuthenticatedActor actor() { return new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN); }
    private CreateCompanyCommand command() { return new CreateCompanyCommand("Nahui SAC", null, "NAHUI", null, new CompanySettings("America/Lima", "PEN", 100, 60, 90, null)); }
    private static final class TrackingTransactionManager implements PlatformTransactionManager {
        private final PlatformTransactionManager delegate;
        private int transactionsStarted;
        private TrackingTransactionManager(DriverManagerDataSource dataSource) { this.delegate = new DataSourceTransactionManager(dataSource); }
        @Override public TransactionStatus getTransaction(TransactionDefinition definition) {
            transactionsStarted++;
            return delegate.getTransaction(definition);
        }
        @Override public void commit(TransactionStatus status) { delegate.commit(status); }
        @Override public void rollback(TransactionStatus status) { delegate.rollback(status); }
    }
}
