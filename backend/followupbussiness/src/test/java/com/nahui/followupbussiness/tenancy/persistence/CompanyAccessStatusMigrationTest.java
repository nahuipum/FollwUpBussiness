package com.nahui.followupbussiness.tenancy.persistence;

import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyAccessStatusQuery;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CompanyAccessStatusMigrationTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbcTemplate;
    private JdbcCompanyAccessStatusQuery query;

    @BeforeAll
    static void startPostgres() { POSTGRES.start(); }

    @AfterAll
    static void stopPostgres() { POSTGRES.stop(); }

    @BeforeEach
    void migrateCleanDatabase() {
        Flyway flyway = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration").cleanDisabled(false).load();
        flyway.clean();
        flyway.migrate();
        jdbcTemplate = new JdbcTemplate(new DriverManagerDataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()));
        query = new JdbcCompanyAccessStatusQuery(jdbcTemplate);
    }

    @Test
    void returnsTrueOnlyForExistingActiveCompany() {
        UUID active = insert("ACTIVE");
        UUID suspended = insert("SUSPENDED");

        assertThat(query.isActive(active)).isTrue();
        assertThat(query.isActive(suspended)).isFalse();
        assertThat(query.isActive(UUID.randomUUID())).isFalse();
    }

    private UUID insert(String status) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.parse("2026-08-01T00:00:00Z");
        java.sql.Timestamp timestamp = java.sql.Timestamp.from(now);
        jdbcTemplate.update("INSERT INTO tenancy_company(id, status, created_at, updated_at) VALUES (?, ?, ?, ?)", id, status, timestamp, timestamp);
        return id;
    }
}
