package com.nahui.followupbussiness.customers.persistence;

import static org.assertj.core.api.Assertions.*;

import com.nahui.followupbussiness.audit.application.AuditTrustedContext;
import com.nahui.followupbussiness.audit.application.RecordAuditEntry;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.config.CustomerConfiguration;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import java.util.UUID;
import java.time.Clock;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.aop.support.AopUtils;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CustomerCreationTransactionIntegrationTest {
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbc; private DriverManagerDataSource dataSource; private UUID tenant;
    @BeforeAll static void start() { postgres.start(); }
    @AfterAll static void stop() { postgres.stop(); }
    @BeforeEach void migrate() { Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").cleanDisabled(false).load().clean(); Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").load().migrate(); dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()); jdbc = new JdbcTemplate(dataSource); tenant = UUID.randomUUID(); jdbc.update("insert into tenancy_company(id,status,created_at,updated_at) values (?,'ACTIVE',current_timestamp,current_timestamp)", tenant); }
    @Test void storesWgs84Point() {
        try (var context = context()) { var service = context.getBean(CreateCustomerService.class); assertThat(AopUtils.isAopProxy(service)).isTrue(); service.create(command(), actor()); }
        assertThat(jdbc.queryForObject("select ST_SRID(location) from customer", Integer.class)).isEqualTo(4326);
        assertThat(jdbc.queryForObject("select ST_X(location) from customer", Double.class)).isEqualTo(-77.1d);
        assertThat(jdbc.queryForObject("select ST_Y(location) from customer", Double.class)).isEqualTo(-12.1d);
    }
    @Test void rollsBackCustomerAndAuditWhenCommitFailsAfterAuditWasWritten() {
        jdbc.execute("create table forced_customer_commit_failure (id uuid primary key)");
        jdbc.execute("alter table customer add constraint fk_customer_commit_failure foreign key (id) references forced_customer_commit_failure(id) deferrable initially deferred");
        try (var context = context()) {
            assertThatThrownBy(() -> context.getBean(CreateCustomerService.class).create(command(), actor())).isInstanceOf(RuntimeException.class);
        }
        assertThat(jdbc.queryForObject("select count(*) from customer", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from audit_entry where resource_type='CUSTOMER' and result='SUCCESS'", Integer.class)).isZero();
    }
    private AnnotationConfigApplicationContext context() { var c = new AnnotationConfigApplicationContext(); c.registerBean(JdbcTemplate.class, () -> jdbc); c.registerBean(PlatformTransactionManager.class, () -> new DataSourceTransactionManager(dataSource)); c.registerBean(AuditTrustedContextProvider.class, () -> () -> new AuditTrustedContext(tenant, UUID.randomUUID(), UUID.randomUUID(), com.nahui.followupbussiness.audit.domain.AuditScope.AUTHORIZED_RESOURCE)); c.register(Config.class); c.refresh(); return c; }
    private CreateCustomerService.Command command() { return new CreateCustomerService.Command("Customer", null, null, null, null, "Address", new GeoPoint(-12.1, -77.1), null, null); }
    private AuthenticatedActor actor() { return new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN); }
    @Configuration(proxyBeanMethods = false) @EnableTransactionManagement @Import(CustomerConfiguration.class) static class Config {
        @Bean("transactionalAuditEntryUseCase") RecordAuditEntryUseCase transactionalAuditEntryUseCase(JdbcTemplate jdbc, AuditTrustedContextProvider contextProvider) {
            return new RecordAuditEntry(new JdbcAuditEntryStore(jdbc, jdbc), contextProvider, Clock.systemUTC());
        }
    }
}
