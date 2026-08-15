package com.nahui.followupbussiness.workforce.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcIdentityNotificationAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPasswordRecoveryAdapter;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcSellerStore;
import com.nahui.followupbussiness.workforce.application.SellerService;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
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

    private CompanyUserService invitationWritingUsers(JdbcTemplate jdbc) {
        byte[] hmac = "01234567890123456789012345678901".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return new CompanyUserService(jdbc, Clock.systemUTC(), new JdbcPasswordRecoveryAdapter(jdbc),
                new JdbcIdentityNotificationAdapter(jdbc, hmac), null, null, hmac);
    }

    private int count(String table) { return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class); }

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
