package com.nahui.followupbussiness.workforce.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcIdentityNotificationAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcLoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPasswordRecoveryAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPasswordRecoveryRequestAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcRefreshSessionAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcSessionFamilyAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.security.BCryptPasswordHashingAdapter;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.application.LoginService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryService;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcSellerStore;
import com.nahui.followupbussiness.workforce.application.SellerService;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;
import com.nahui.followupbussiness.workforce.domain.Seller;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class SellerCreationTransactionIntegrationTest {
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private UUID tenant;

    @BeforeAll
    static void start() { postgres.start(); }

    @AfterAll
    static void stop() { postgres.stop(); }

    @BeforeEach
    void migrate() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").cleanDisabled(false).load().clean();
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").load().migrate();
        dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        jdbc = new JdbcTemplate(dataSource);
        tenant = UUID.randomUUID();
        jdbc.update("INSERT INTO tenancy_company(id,status,created_at,updated_at) VALUES (?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", tenant);
    }

    @Test
    void rollsBackAccountSellerRelationsAndUsableInvitationWhenAuditReturnsFalse() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(JdbcTemplate.class, () -> jdbc);
            context.registerBean(PlatformTransactionManager.class, () -> new DataSourceTransactionManager(dataSource));
            context.registerBean(CompanyUserService.class, () -> invitationWritingUsers(jdbc));
            context.registerBean(RecordAuditEntryUseCase.class, () -> command -> false);
            context.register(TransactionalSellerConfiguration.class);
            context.refresh();

            SellerService service = context.getBean(SellerService.class);
            assertThat(AopUtils.isAopProxy(service)).isTrue();
            assertThatThrownBy(() -> service.create(command(), admin(), UUID.randomUUID())).isInstanceOf(IllegalStateException.class);
        }

        assertThat(count("identity_access_account")).isZero();
        assertThat(count("workforce_seller")).isZero();
        assertThat(count("workforce_seller_territory")).isZero();
        assertThat(count("identity_access_action_token")).isZero();
        assertThat(count("identity_access_notification")).isZero();
    }

    @Test
    void rollsBackSupervisorRelationWhenItsAuditCannotBePersisted() {
        UUID sellerAccount = account("seller@example.test", "SELLER");
        UUID oldSupervisor = account("old-supervisor@example.test", "SUPERVISOR");
        UUID newSupervisor = account("new-supervisor@example.test", "SUPERVISOR");
        UUID seller = UUID.randomUUID();
        jdbc.update("INSERT INTO workforce_seller(id,tenant_id,user_id,display_name,email,supervisor_id,status,created_at,updated_at,version) VALUES (?,?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)",
                seller, tenant, sellerAccount, "Seller", "seller@example.test", oldSupervisor);

        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(JdbcTemplate.class, () -> jdbc);
            context.registerBean(PlatformTransactionManager.class, () -> new DataSourceTransactionManager(dataSource));
            context.registerBean(CompanyUserService.class, () -> invitationWritingUsers(jdbc));
            context.registerBean(RecordAuditEntryUseCase.class, () -> command -> false);
            context.register(TransactionalSellerConfiguration.class);
            context.refresh();

            SellerService service = context.getBean(SellerService.class);
            assertThatThrownBy(() -> service.assignSupervisor(seller, newSupervisor, admin(), UUID.randomUUID())).isInstanceOf(IllegalStateException.class);
        }

        assertThat(jdbc.queryForObject("SELECT supervisor_id FROM workforce_seller WHERE id=?", UUID.class, seller)).isEqualTo(oldSupervisor);
        assertThat(jdbc.queryForObject("SELECT version FROM workforce_seller WHERE id=?", Long.class, seller)).isEqualTo(1L);
    }

    @Test
    void rollsBackTerritoryReplacementWhenItsAuditCannotBePersisted() {
        UUID sellerAccount = account("seller@example.test", "SELLER");
        UUID seller = UUID.randomUUID();
        UUID oldTerritory = territory("Old", "OLD");
        UUID requestedTerritory = territory("Requested", "REQ");
        jdbc.update("INSERT INTO workforce_seller(id,tenant_id,user_id,display_name,email,status,created_at,updated_at,version) VALUES (?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)",
                seller, tenant, sellerAccount, "Seller", "seller@example.test");
        jdbc.update("INSERT INTO workforce_seller_territory(seller_id,territory_id) VALUES (?,?)", seller, oldTerritory);

        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(JdbcTemplate.class, () -> jdbc);
            context.registerBean(PlatformTransactionManager.class, () -> new DataSourceTransactionManager(dataSource));
            context.registerBean(CompanyUserService.class, () -> invitationWritingUsers(jdbc));
            context.registerBean(RecordAuditEntryUseCase.class, () -> command -> false);
            context.register(TransactionalSellerConfiguration.class);
            context.refresh();

            assertThatThrownBy(() -> context.getBean(SellerService.class)
                    .assignTerritories(seller, List.of(requestedTerritory), admin(), UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class);
        }

        assertThat(jdbc.queryForList("SELECT territory_id FROM workforce_seller_territory WHERE seller_id=?", UUID.class, seller))
                .containsExactly(oldTerritory);
        assertThat(jdbc.queryForObject("SELECT version FROM workforce_seller WHERE id=?", Long.class, seller)).isEqualTo(1L);
    }

    @Test
    void returnsNullSupervisorReferenceForAnUnassignedSeller() {
        UUID sellerAccount = account("seller@example.test", "SELLER");
        UUID sellerId = UUID.randomUUID();
        jdbc.update("INSERT INTO workforce_seller(id,tenant_id,user_id,display_name,email,status,created_at,updated_at,version) VALUES (?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)",
                sellerId, tenant, sellerAccount, "Seller", "seller@example.test");

        JdbcSellerStore store = new JdbcSellerStore(jdbc);
        var seller = store.find(tenant, sellerId).orElseThrow();

        assertThat(store.references(tenant, List.of(seller)).get(sellerId).supervisor()).isNull();
    }

    @Test
    void sellerCreationActivationAndMobileLoginKeepTenantRoleStatusAndAuditConsistent() throws Exception {
        byte[] hmac = "01234567890123456789012345678901".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        AtomicReference<com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand> recordedAudit = new AtomicReference<>();
        Seller seller;
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(JdbcTemplate.class, () -> jdbc);
            context.registerBean(PlatformTransactionManager.class, () -> new DataSourceTransactionManager(dataSource));
            context.registerBean(CompanyUserService.class, () -> invitationWritingUsers(jdbc));
            context.registerBean(RecordAuditEntryUseCase.class, () -> command -> {
                recordedAudit.set(command);
                return true;
            });
            context.register(TransactionalSellerConfiguration.class);
            context.refresh();
            seller = context.getBean(SellerService.class).create(command(), admin(), UUID.randomUUID());
        }

        assertThat(jdbc.queryForObject("SELECT status FROM workforce_seller WHERE id=?", String.class, seller.id())).isEqualTo("INVITED");
        assertThat(jdbc.queryForObject("SELECT role_code FROM identity_access_account WHERE id=?", String.class, seller.userId())).isEqualTo("SELLER");
        assertThat(jdbc.queryForObject("SELECT company_id FROM identity_access_account WHERE id=?", UUID.class, seller.userId())).isEqualTo(tenant);
        assertThat(recordedAudit.get().after()).containsEntry("status", "INVITED");

        String activationToken = "A".repeat(43);
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(hmac, "HmacSHA256"));
        byte[] tokenDigest = mac.doFinal(activationToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        jdbc.update("UPDATE identity_access_action_token SET invalidated_at=CURRENT_TIMESTAMP WHERE account_id=? AND purpose='ACTIVATION'", seller.userId());
        jdbc.update("INSERT INTO identity_access_action_token(id,account_id,company_id,purpose,token_digest,expires_at,created_at) VALUES (?,?,?,?,?,?,?)",
                UUID.randomUUID(), seller.userId(), tenant, "ACTIVATION", tokenDigest, java.sql.Timestamp.from(Instant.now().plusSeconds(60)), java.sql.Timestamp.from(Instant.now()));
        var recovery = new JdbcPasswordRecoveryAdapter(jdbc);
        var sessions = new JdbcSessionFamilyAdapter(jdbc);
        var passwords = new BCryptPasswordHashingAdapter();
        new PasswordRecoveryService(recovery, new JdbcPasswordRecoveryRequestAdapter(jdbc, hmac), (accountId, tenantId, purpose, recipient, token, expiresAt) -> { },
                new JdbcRefreshSessionAdapter(jdbc), passwords, Clock.systemUTC(), hmac).reset(activationToken, "Valid123".toCharArray());

        assertThat(jdbc.queryForObject("SELECT status FROM workforce_seller WHERE id=?", String.class, seller.id())).isEqualTo("ACTIVE");
        assertThat(jdbc.queryForObject("SELECT status FROM identity_access_account WHERE id=?", String.class, seller.userId())).isEqualTo("ACTIVE");
        var login = new LoginService(new JdbcLoginAccountQuery(jdbc), passwords, companyId -> tenant.equals(companyId), sessions,
                (accountId, sessionId, companyId, role) -> "token", Clock.systemUTC(), hmac);
        var result = login.login("seller@example.test", "Valid123".toCharArray(), "MOBILE", UUID.randomUUID());

        assertThat(result.account().role()).isEqualTo(BaseRole.SELLER);
        assertThat(result.account().companyId()).isEqualTo(tenant);
        assertThat(jdbc.queryForObject("SELECT company_id FROM identity_access_session_family WHERE account_id=?", UUID.class, seller.userId())).isEqualTo(tenant);

        Seller inactivated = new SellerService(new JdbcSellerStore(jdbc), invitationWritingUsers(jdbc), command -> true, Clock.systemUTC())
                .status(seller.id(), SellerStatus.INACTIVE, "offboarding approved", admin(), UUID.randomUUID());

        assertThat(inactivated.status()).isEqualTo(SellerStatus.INACTIVE);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_session_family WHERE account_id=? AND revoked_at IS NOT NULL", Integer.class, seller.userId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_action_token WHERE account_id=? AND invalidated_at IS NOT NULL", Integer.class, seller.userId())).isGreaterThan(0);
        assertThatThrownBy(() -> login.login("seller@example.test", "Valid123".toCharArray(), "MOBILE", UUID.randomUUID()))
                .isInstanceOf(LoginService.LoginFailedException.class);
    }

    private CompanyUserService invitationWritingUsers(JdbcTemplate jdbc) {
        byte[] hmac = "01234567890123456789012345678901".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return new CompanyUserService(jdbc, Clock.systemUTC(), new JdbcPasswordRecoveryAdapter(jdbc),
                new JdbcIdentityNotificationAdapter(jdbc, hmac), null, null, hmac);
    }

    private int count(String table) { return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class); }

    private UUID account(String login, String role) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)",
                id, login, "$2a$12$7EqJtq98hPqEX7fNZaFWoOa2K7lTznWh.4Dq1EzDY9B6avS1KDo7a", role, tenant);
        return id;
    }

    private UUID territory(String name, String code) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO workforce_territory(id,tenant_id,name,code,status,created_at,updated_at,version) VALUES (?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)",
                id, tenant, name, code);
        return id;
    }

    private SellerService.Command command() { return new SellerService.Command("Seller One", null, "seller@example.test", null, null, null, List.of()); }

    private AuthenticatedActor admin() { return new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN, null); }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement
    static class TransactionalSellerConfiguration {
        @Bean
        SellerService sellerService(JdbcTemplate jdbc, CompanyUserService users, RecordAuditEntryUseCase audit) {
            return new SellerService(new JdbcSellerStore(jdbc), users, audit, Clock.systemUTC());
        }
    }
}
