package com.nahui.followupbussiness.imports.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.application.RecordAuditEntry;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerStore;
import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.adapter.out.persistence.JdbcCustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CustomerImportProcessorPersistenceIntegrationTest {
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbc;

    @BeforeAll static void start() { postgres.start(); }
    @AfterAll static void stop() { postgres.stop(); }

    @BeforeEach
    void migrate() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").cleanDisabled(false).load().clean();
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").load().migrate();
        jdbc = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()));
    }

    @Test
    void persistsTheValidRowAndAuditsItWhenTheOtherRowIsInvalid() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID(), actorId = UUID.randomUUID(), correlationId = UUID.randomUUID();
        jdbc.update("insert into tenancy_company(id,status,created_at,updated_at) values (?,'ACTIVE',current_timestamp,current_timestamp)", tenantId);
        var imports = new JdbcCustomerImportStore(jdbc);
        var job = new CustomerImport(importId, tenantId, actorId, correlationId, "key", "customers.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.PENDING, 0, 0, Instant.now(), Instant.now(), null, null);
        byte[] csv = ("# template-version: 1.0\n"
                + "name,address,latitude,longitude,documentType,documentNumber,phone,email,segment,visitFrequencyDays,territoryId\n"
                + "Cliente,Dirección,-12.0464,-77.0428,,,,,,,\n"
                + "Cliente inválido,Dirección,invalid,-77.0428,,,,,,,\n").getBytes(StandardCharsets.UTF_8);
        imports.insertIfAbsent(job, csv);
        var customers = new JdbcCustomerStore(jdbc);
        var audit = new RecordAuditEntry(new JdbcAuditEntryStore(jdbc, jdbc), new SecurityContextAuditTrustedContextProvider(), Clock.systemUTC());
        var processor = new CustomerImportProcessor(imports,
                new CreateCustomerService(customers, (tenant, territory) -> true, audit, Clock.systemUTC()),
                new CheckCustomerDuplicatesService(customers));
        var authentication = UsernamePasswordAuthenticationToken.authenticated(new AuthenticatedActor(actorId, tenantId, BaseRole.COMPANY_ADMIN), "internal-import-worker", List.of());
        authentication.setDetails(correlationId);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            processor.process(importId, tenantId);
        } finally {
            SecurityContextHolder.clearContext();
        }

        var completed = imports.findById(tenantId, importId).orElseThrow();
        assertThat(completed.status()).isEqualTo(CustomerImport.Status.COMPLETED_WITH_ERRORS);
        assertThat(completed.acceptedRows()).isEqualTo(1);
        assertThat(completed.rejectedRows()).isEqualTo(1);
        assertThat(imports.findRowErrors(tenantId, importId)).containsExactly(new com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore.RowError(4, "INVALID_ROW"));
        assertThat(jdbc.queryForObject("select count(*) from customer", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from audit_entry where resource_type='CUSTOMER' and result='SUCCESS'", Integer.class)).isEqualTo(1);
    }
}
