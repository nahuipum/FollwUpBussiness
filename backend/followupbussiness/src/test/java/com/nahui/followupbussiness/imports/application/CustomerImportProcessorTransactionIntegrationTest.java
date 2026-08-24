package com.nahui.followupbussiness.imports.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.imports.adapter.out.persistence.JdbcCustomerImportStore;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CustomerImportProcessorTransactionIntegrationTest {
    private static PostgreSQLContainer<?> postgres;

    @BeforeAll
    static void startPostgres() {
        postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
        postgres.start();
    }

    @AfterAll
    static void stopPostgres() {
        if (postgres != null) postgres.stop();
    }

    @Test
    void failureAfterClaimRollsBackTheProcessingState() {
        var dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        var jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("DROP TABLE IF EXISTS customer_import_row_error");
        jdbc.execute("DROP TABLE IF EXISTS customer_import");
        jdbc.execute("CREATE TABLE customer_import (id UUID PRIMARY KEY, tenant_id UUID NOT NULL, requested_by UUID NOT NULL, correlation_id UUID NOT NULL, idempotency_key VARCHAR(128) NOT NULL, file_name VARCHAR(255) NOT NULL, content_type VARCHAR(160) NOT NULL, template_version VARCHAR(16) NOT NULL, partial_acceptance BOOLEAN NOT NULL, file_sha256 CHAR(64) NOT NULL, status VARCHAR(32) NOT NULL, accepted_rows INTEGER NOT NULL, rejected_rows INTEGER NOT NULL, original_file BYTEA, created_at TIMESTAMP WITH TIME ZONE NOT NULL, updated_at TIMESTAMP WITH TIME ZONE NOT NULL, terminal_at TIMESTAMP WITH TIME ZONE, error_file_expires_at TIMESTAMP WITH TIME ZONE)");
        jdbc.execute("CREATE TABLE customer_import_row_error (id UUID PRIMARY KEY, import_id UUID NOT NULL, row_number INTEGER NOT NULL, error_code VARCHAR(80) NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL)");
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID();
        jdbc.update("INSERT INTO customer_import VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", importId, tenantId, UUID.randomUUID(), UUID.randomUUID(), "key", "customers.csv", "text/csv", "1.0", true, "0".repeat(64), "PENDING", 0, 0, "# template-version: 1.0\nname,address,latitude,longitude,documentType,documentNumber,phone,email,segment,visitFrequencyDays,territoryId\n".getBytes(), Timestamp.from(Instant.now()), Timestamp.from(Instant.now()), null, null);

        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(DataSourceTransactionManager.class, () -> new DataSourceTransactionManager(dataSource));
            context.registerBean(CustomerImportStore.class, () -> new FailingRowErrorStore(new JdbcCustomerImportStore(jdbc)));
            context.registerBean(CreateCustomerService.class, () -> mock(CreateCustomerService.class));
            context.registerBean(CheckCustomerDuplicatesService.class, () -> mock(CheckCustomerDuplicatesService.class));
            context.register(Transactions.class);
            context.refresh();

            assertThatThrownBy(() -> context.getBean(CustomerImportProcessor.class).process(importId, tenantId)).isInstanceOf(IllegalStateException.class);
        }
        org.assertj.core.api.Assertions.assertThat(jdbc.queryForObject("SELECT status FROM customer_import WHERE id=?", String.class, importId)).isEqualTo("PENDING");
    }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement
    static class Transactions {
        @Bean CustomerImportProcessor customerImportProcessor(CustomerImportStore store, CreateCustomerService customers, CheckCustomerDuplicatesService duplicates) {
            return new CustomerImportProcessor(store, customers, duplicates);
        }
    }

    private record FailingRowErrorStore(CustomerImportStore delegate) implements CustomerImportStore {
        public Optional<CustomerImport> findByIdempotency(UUID tenantId, UUID requesterId, String key) { return delegate.findByIdempotency(tenantId, requesterId, key); }
        public Optional<CustomerImport> findById(UUID tenantId, UUID id) { return delegate.findById(tenantId, id); }
        public Optional<CustomerImport> insertIfAbsent(CustomerImport job, byte[] contents) { return delegate.insertIfAbsent(job, contents); }
        public Optional<ClaimedImport> claim(UUID importId, UUID tenantId) { return delegate.claim(importId, tenantId); }
        public void complete(UUID importId, int acceptedRows, int rejectedRows, boolean failed) { delegate.complete(importId, acceptedRows, rejectedRows, failed); }
        public void recordRowErrors(UUID importId, List<RowError> errors) { throw new IllegalStateException("post-claim persistence failure"); }
        public Optional<CustomerImport> fail(UUID importId, UUID tenantId) { return delegate.fail(importId, tenantId); }
        public int purgeExpiredFiles() { return delegate.purgeExpiredFiles(); }
        public int purgeExpiredRowErrors() { return delegate.purgeExpiredRowErrors(); }
    }
}
