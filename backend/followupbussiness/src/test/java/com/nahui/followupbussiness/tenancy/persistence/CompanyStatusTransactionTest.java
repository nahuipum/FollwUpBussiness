package com.nahui.followupbussiness.tenancy.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.application.PlatformAuditTrustedContext;
import com.nahui.followupbussiness.audit.application.CompanyDenialAuditTrustedContext;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAudit;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAudit;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.ChangeCompanyStatusCommand;
import com.nahui.followupbussiness.tenancy.application.port.in.ChangeCompanyStatusUseCase;
import com.nahui.followupbussiness.tenancy.config.TenancyConfiguration;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CompanyStatusTransactionTest {
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(
            DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbc;
    private DriverManagerDataSource dataSource;
    private UUID companyId;

    @BeforeAll static void start() { postgres.start(); }
    @AfterAll static void stop() { postgres.stop(); }
    @BeforeEach void migrate() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration").cleanDisabled(false).load().clean();
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration").load().migrate();
        dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        jdbc = new JdbcTemplate(dataSource);
        companyId = UUID.randomUUID();
        jdbc.update("INSERT INTO tenancy_company(id,legal_name,code,status,created_at,updated_at,version) VALUES (?,?,'NAHUI','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)", companyId, "Nahui SAC");
        jdbc.update("INSERT INTO tenancy_company_settings(company_id,timezone,currency,geofence_radius_meters,tracking_interval_seconds,location_retention_days,created_at,updated_at) VALUES (?,'America/Lima','PEN',100,60,90,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", companyId);
    }

    @Test void transitionPersistsOnlyReasonPresenceAndStructuredAuditWhileRepeatedStatusIsAWriteFreeNoOp() {
        UUID actorId = UUID.randomUUID();
        var service = service(audit(actorId));
        var first = service.execute(companyId, command(CompanyStatus.SUSPENDED, "Alice Smith admin@example.test token=opaque Bearer demo-token api_key=demo-secret arbitrary free text"), actor(actorId));
        Instant updatedAt = jdbc.queryForObject("SELECT updated_at FROM tenancy_company WHERE id=?", java.sql.Timestamp.class, companyId).toInstant();
        assertThat(first.company().status()).isEqualTo(CompanyStatus.SUSPENDED);
        assertThat(jdbc.queryForObject("SELECT version FROM tenancy_company WHERE id=?", Long.class, companyId)).isEqualTo(2L);
        assertThat(jdbc.queryForObject("SELECT before_state->>'status' FROM audit_entry", String.class)).isEqualTo("ACTIVE");
        assertThat(jdbc.queryForObject("SELECT after_state->>'status' FROM audit_entry", String.class)).isEqualTo("SUSPENDED");
        assertThat(jdbc.queryForObject("SELECT reason FROM audit_entry", String.class)).isEqualTo("REASON_PROVIDED");
        assertThat(jdbc.queryForObject("SELECT actor_id FROM audit_entry", UUID.class)).isEqualTo(actorId);
        assertThat(jdbc.queryForObject("SELECT resource_id FROM audit_entry", UUID.class)).isEqualTo(companyId);
        assertThat(jdbc.queryForObject("SELECT action FROM audit_entry", String.class)).isEqualTo("CRITICAL_MUTATION");
        assertThat(jdbc.queryForObject("SELECT result FROM audit_entry", String.class)).isEqualTo("SUCCESS");

        var second = service.execute(companyId, command(CompanyStatus.SUSPENDED), actor());
        assertThat(second.company().version()).isEqualTo(2L);
        assertThat(jdbc.queryForObject("SELECT updated_at FROM tenancy_company WHERE id=?", java.sql.Timestamp.class, companyId).toInstant()).isEqualTo(updatedAt);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry", Integer.class)).isEqualTo(1);
    }

    @Test void failedAuditRollsBackTheStatusMutation() {
        RecordPlatformCompanyAuditUseCase failing = command -> { throw new IllegalStateException("audit unavailable"); };
        assertThatThrownBy(() -> service(failing).execute(companyId, command(CompanyStatus.SUSPENDED), actor()))
                .isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT status FROM tenancy_company WHERE id=?", String.class, companyId)).isEqualTo("ACTIVE");
        assertThat(jdbc.queryForObject("SELECT version FROM tenancy_company WHERE id=?", Long.class, companyId)).isEqualTo(1L);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry", Integer.class)).isZero();
    }

    @Test void concurrentIdenticalRequestsProduceOneMutationAndOneChangeAudit() throws Exception {
        var service = service(audit());
        CountDownLatch gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> { gate.await(); return service.execute(companyId, command(CompanyStatus.SUSPENDED), actor()); });
            var second = pool.submit(() -> { gate.await(); return service.execute(companyId, command(CompanyStatus.SUSPENDED), actor()); });
            gate.countDown();
            assertThat(first.get().company().status()).isEqualTo(CompanyStatus.SUSPENDED);
            assertThat(second.get().company().status()).isEqualTo(CompanyStatus.SUSPENDED);
        }
        assertThat(jdbc.queryForObject("SELECT version FROM tenancy_company WHERE id=?", Long.class, companyId)).isEqualTo(2L);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE result='SUCCESS'", Integer.class)).isEqualTo(1);
    }

    @Test void tenantBoundDenialCommitsDurableEvidenceWithoutMutatingTheCompany() {
        UUID tenantId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID correlationId = UUID.randomUUID();
        RecordCompanyDenialAuditUseCase denial = new RecordCompanyDenialAudit(new JdbcAuditEntryStore(jdbc, jdbc),
                () -> new CompanyDenialAuditTrustedContext(tenantId, actorId, correlationId,
                        Instant.parse("2026-08-06T12:00:00Z")));
        var actor = new AuthenticatedActor(actorId, tenantId, BaseRole.COMPANY_ADMIN);
        assertThatThrownBy(() -> service(audit(), denial).execute(companyId, command(CompanyStatus.SUSPENDED), actor))
                .isInstanceOf(com.nahui.followupbussiness.tenancy.application.ChangeCompanyStatusService.AccessDeniedException.class);
        assertThat(jdbc.queryForObject("SELECT status FROM tenancy_company WHERE id=?", String.class, companyId)).isEqualTo("ACTIVE");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE tenant_id=? AND actor_id=? AND resource_id=? AND correlation_id=? AND result='DENIED' AND scope='TENANT_BOUND_DENIAL'",
                Integer.class, tenantId, actorId, companyId, correlationId)).isEqualTo(1);
    }

    private ChangeCompanyStatusUseCase service(RecordPlatformCompanyAuditUseCase audit) {
        return service(audit, command -> { });
    }
    private ChangeCompanyStatusUseCase service(RecordPlatformCompanyAuditUseCase audit, RecordCompanyDenialAuditUseCase denial) {
        return new TenancyConfiguration().changeCompanyStatusUseCase(jdbc, new DataSourceTransactionManager(dataSource), audit, denial);
    }
    private RecordPlatformCompanyAuditUseCase audit() {
        return audit(UUID.randomUUID());
    }
    private RecordPlatformCompanyAuditUseCase audit(UUID actorId) {
        return new RecordPlatformCompanyAudit(new JdbcAuditEntryStore(jdbc, jdbc),
                () -> new PlatformAuditTrustedContext(actorId, UUID.randomUUID(), Instant.parse("2026-08-06T12:00:00Z")));
    }
    private ChangeCompanyStatusCommand command(CompanyStatus status) {
        return command(status, "Operational review");
    }
    private ChangeCompanyStatusCommand command(CompanyStatus status, String reason) { return new ChangeCompanyStatusCommand(status, reason); }
    private AuthenticatedActor actor() {
        return actor(UUID.randomUUID());
    }
    private AuthenticatedActor actor(UUID actorId) { return new AuthenticatedActor(actorId, null, BaseRole.PLATFORM_SUPERADMIN); }
}
