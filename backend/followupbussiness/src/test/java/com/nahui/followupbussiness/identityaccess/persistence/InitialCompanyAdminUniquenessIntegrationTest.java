package com.nahui.followupbussiness.identityaccess.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextCompanyDenialAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.application.PlatformAuditTrustedContext;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAudit;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAudit;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcInitialCompanyAdminStore;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.InitialCompanyAdminController;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.identityaccess.application.ProvisionInitialCompanyAdminCommand;
import com.nahui.followupbussiness.identityaccess.application.ProvisionInitialCompanyAdminService;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.config.AuthenticationProperties;
import com.nahui.followupbussiness.identityaccess.config.LoginConfiguration;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyAccessStatusQuery;
import java.lang.reflect.Method;
import java.time.Clock;
import java.time.Instant;
import java.util.*; import java.util.concurrent.*;
import org.flywaydb.core.Flyway; import org.junit.jupiter.api.*; import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager; import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.testcontainers.postgresql.PostgreSQLContainer; import org.testcontainers.utility.DockerImageName;

class InitialCompanyAdminUniquenessIntegrationTest {
    static PostgreSQLContainer postgres; JdbcTemplate jdbc; JdbcInitialCompanyAdminStore store; UUID first, second;
    @BeforeAll static void start(){postgres=new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));postgres.start();}
    @AfterAll static void stop(){if(postgres!=null)postgres.stop();}
    @BeforeEach void reset(){var ds=new DriverManagerDataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword());var f=Flyway.configure().dataSource(ds).locations("classpath:db/migration").cleanDisabled(false).load();f.clean();f.migrate();jdbc=new JdbcTemplate(ds);store=new JdbcInitialCompanyAdminStore(jdbc);first=company();second=company();}
    @Test void concurrentSameCompanyEmailOrUsernameAllowsExactlyOneWhileOtherCompanyAllowsSameIdentifier() throws Exception {
        UUID one=UUID.randomUUID(),two=UUID.randomUUID(); try(var pool=Executors.newFixedThreadPool(2)){var gate=new CountDownLatch(1);var a=pool.submit(()->{gate.await();return store.create(one,first,"admin",hash(),"Admin","admin@example.test");});var b=pool.submit(()->{gate.await();return store.create(two,first,"admin",hash(),"Admin","admin@example.test");});gate.countDown();assertThat(List.of(a.get(),b.get())).containsExactlyInAnyOrder(true,false);}
        assertThat(store.create(UUID.randomUUID(),second,"admin",hash(),"Admin","admin@example.test")).isTrue();
    }
    @Test void transactionFailureAfterAccountInsertRollsBackProvisioningMutation(){
        var tx=new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
        assertThatThrownBy(()->tx.executeWithoutResult(s->{store.create(UUID.randomUUID(),first,"rollback",hash(),"Admin","rollback@example.test");throw new IllegalStateException("notification failure");})).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account WHERE company_id=?",Integer.class,first)).isZero();
    }
    @Test void conflictAuditRunsAfterTheProvisioningTransactionRollsBack() throws Exception {
        UUID actor = UUID.randomUUID(); UUID correlation = UUID.randomUUID();
        RecordPlatformCompanyAuditUseCase audit = command -> jdbc.update("""
                INSERT INTO audit_entry(id, tenant_id, actor_id, action, resource_type, resource_id, result,
                    correlation_id, scope, before_state, after_state, occurred_at)
                VALUES (?, NULL, ?, ?, 'COMPANY', ?, ?, ?, 'PLATFORM', '{}'::jsonb, '{}'::jsonb, CURRENT_TIMESTAMP)
                """, UUID.randomUUID(), actor, command.action().name(), command.resourceId(), command.result().name(), correlation);
        ProvisionInitialCompanyAdminUseCase service = configuredService(audit);
        var authenticated = new AuthenticatedActor(actor, null, BaseRole.PLATFORM_SUPERADMIN);
        var command = new ProvisionInitialCompanyAdminCommand(first, "Initial Admin", "admin", "admin@example.test");
        service.execute(command, authenticated);

        assertThatThrownBy(() -> service.execute(command, authenticated))
                .isInstanceOf(ProvisionInitialCompanyAdminService.Conflict.class);
        assertThat(jdbc.queryForList("SELECT action, result FROM audit_entry WHERE resource_id=? ORDER BY occurred_at", first))
                .extracting(row -> row.get("action") + ":" + row.get("result"))
                .containsExactly("PROVISION_INITIAL_COMPANY_ADMIN:SUCCESS", "PROVISION_INITIAL_COMPANY_ADMIN:CONFLICT");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account WHERE company_id=?", Integer.class, first))
                .isEqualTo(1);
    }
    @Test void auditWriterFailureRollsBackTheCompleteBe057Provisioning() throws Exception {
        UUID actor = UUID.randomUUID(); UUID correlation = UUID.randomUUID();
        JdbcTemplate failingWriter = new JdbcTemplate(jdbc.getDataSource()) {
            @Override public int update(String sql, Object... args) {
                if (sql.contains("INSERT INTO audit_entry")) throw new IllegalStateException("audit writer unavailable");
                return super.update(sql, args);
            }
        };
        RecordPlatformCompanyAuditUseCase audit = new RecordPlatformCompanyAudit(
                new JdbcAuditEntryStore(failingWriter, jdbc),
                () -> new PlatformAuditTrustedContext(actor, correlation, Instant.now()));
        ProvisionInitialCompanyAdminUseCase service = configuredService(audit);

        assertThatThrownBy(() -> service.execute(
                new ProvisionInitialCompanyAdminCommand(first, "Rollback Admin", "rollback-admin", "rollback@example.test"),
                new AuthenticatedActor(actor, null, BaseRole.PLATFORM_SUPERADMIN)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("audit writer unavailable");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account WHERE company_id=?", Integer.class, first)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account WHERE company_id=? AND role_code='COMPANY_ADMIN'", Integer.class, first)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_action_token WHERE company_id=?", Integer.class, first)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_notification WHERE company_id=?", Integer.class, first)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry WHERE resource_id=?", Integer.class, first)).isZero();
    }
    @Test void tenantBoundBe057RequestReturns403WithoutMutationAndPersistsSanitizedDeniedAudit() throws Exception {
        UUID actorId = UUID.randomUUID(); UUID tenantId = second;
        String unsafeCorrelation = "admin@example.test-password-Secret-token-abc-payload-header";
        String requestBody = "{\"displayName\":\"Initial Admin\",\"username\":\"secret-username\",\"email\":\"admin@example.test\"}";
        RecordCompanyDenialAuditUseCase denialAudit = new RecordCompanyDenialAudit(
                new JdbcAuditEntryStore(jdbc, jdbc), new SecurityContextCompanyDenialAuditTrustedContextProvider(Clock.systemUTC()));
        ProvisionInitialCompanyAdminUseCase service = configuredService(command -> { }, denialAudit);
        var actor = new AuthenticatedActor(actorId, tenantId, BaseRole.PLATFORM_SUPERADMIN);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(actor, "not-a-real-password", List.of()));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(new InitialCompanyAdminController(service))
                    .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
            var response = mvc.perform(post("/platform/companies/{id}/initial-admin", first)
                            .header("X-Correlation-Id", unsafeCorrelation)
                            .contentType(MediaType.APPLICATION_JSON).content(requestBody))
                    .andExpect(status().isForbidden()).andReturn().getResponse();

            UUID sanitizedCorrelation = UUID.fromString(response.getHeader("X-Correlation-Id"));
            assertThat(response.getContentAsString()).doesNotContain("admin@example.test", "Initial Admin", "secret-username",
                    "not-a-real-password", "token-abc", "payload", "header", unsafeCorrelation);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account WHERE company_id=?", Integer.class, first)).isZero();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account WHERE company_id=? AND role_code='COMPANY_ADMIN'", Integer.class, first)).isZero();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_action_token WHERE company_id=?", Integer.class, first)).isZero();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_notification WHERE company_id=?", Integer.class, first)).isZero();
            assertThat(jdbc.queryForObject("""
                    SELECT COUNT(*) FROM audit_entry
                    WHERE scope='TENANT_BOUND_DENIAL' AND tenant_id=? AND actor_id=?
                      AND action='PROVISION_INITIAL_COMPANY_ADMIN' AND resource_type='COMPANY'
                      AND resource_id=? AND result='DENIED' AND correlation_id=?
                      AND before_state='{}'::jsonb AND after_state='{}'::jsonb
                    """, Integer.class, tenantId, actorId, first, sanitizedCorrelation)).isEqualTo(1);
            String persistedEvidence = jdbc.queryForObject(
                    "SELECT to_jsonb(audit_entry)::text FROM audit_entry WHERE resource_id=?", String.class, first);
            assertThat(persistedEvidence).doesNotContain("admin@example.test", "Initial Admin", "secret-username",
                    "not-a-real-password", "token-abc", "payload", "header", unsafeCorrelation);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
    private ProvisionInitialCompanyAdminUseCase configuredService(RecordPlatformCompanyAuditUseCase audit) throws Exception {
        return configuredService(audit, command -> { });
    }
    private ProvisionInitialCompanyAdminUseCase configuredService(RecordPlatformCompanyAuditUseCase audit,
            RecordCompanyDenialAuditUseCase denialAudit) throws Exception {
        AuthenticationProperties.Values properties = new AuthenticationProperties.Values();
        properties.setHmacSecret("01234567890123456789012345678901");
        Method method = LoginConfiguration.class.getDeclaredMethod("provisionInitialCompanyAdminUseCase", JdbcTemplate.class,
                com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery.class,
                AuthenticationProperties.Values.class, RecordPlatformCompanyAuditUseCase.class, RecordCompanyDenialAuditUseCase.class);
        method.setAccessible(true);
        return (ProvisionInitialCompanyAdminUseCase) method.invoke(new LoginConfiguration(), jdbc,
                new JdbcCompanyAccessStatusQuery(jdbc), properties, audit, denialAudit);
    }
    private UUID company(){UUID id=UUID.randomUUID();jdbc.update("INSERT INTO tenancy_company(id,status,created_at,updated_at) VALUES (?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",id);return id;}
    private static String hash(){return "$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoAA";}
}
