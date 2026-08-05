package com.nahui.followupbussiness.identityaccess.persistence;

import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuthenticationAuditAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcRefreshSessionAdapter;
import com.nahui.followupbussiness.identityaccess.application.LogoutSessionService;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RevocationTicketIntegrityIntegrationTest {
    private static final DockerImageName IMAGE = DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres");
    private static final byte[] KEY = "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
    private static PostgreSQLContainer postgres;

    private final Instant now = Instant.parse("2026-08-05T12:00:00Z");
    private JdbcTemplate jdbc;
    private TransactionTemplate tx;

    @BeforeAll
    static void start() {
        postgres = new PostgreSQLContainer(IMAGE).withDatabaseName("be005_ticket_integrity").withUsername("be005").withPassword("be005");
        postgres.start();
    }

    @AfterAll
    static void stop() {
        if (postgres != null) postgres.stop();
    }

    @BeforeEach
    void migrateCurrentSchema() {
        resetTo(null);
    }

    @Test
    void currentSchemaRejectsDuplicateTicketAcrossTenantsWithoutMutatingTheFirstFamily() {
        byte[] ticket = hmac("shared-ticket");
        UUID first = insertMobileFamily(ticket);

        assertThatThrownBy(() -> insertMobileFamily(ticket))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(jdbc.queryForObject("SELECT revoked_at IS NULL FROM identity_access_session_family WHERE id=?", Boolean.class, first)).isTrue();
        assertThat(jdbc.queryForObject("SELECT revocation_ticket_digest FROM identity_access_session_family WHERE id=?", byte[].class, first)).isEqualTo(ticket);
    }

    @Test
    void legacyDuplicateTicketFailsClosedAndLeavesBothTenantsAndAuditUntouched() {
        resetTo("11");
        byte[] ticket = hmac("legacy-shared-ticket");
        UUID first = insertMobileFamily(ticket);
        UUID second = insertMobileFamily(ticket);
        var logout = new LogoutSessionService(
                new JdbcRefreshSessionAdapter(jdbc), new JdbcAuthenticationAuditAdapter(jdbc),
                Clock.fixed(now, ZoneOffset.UTC), KEY);

        assertThatThrownBy(() -> tx.executeWithoutResult(status -> logout.logout(
                new LogoutSessionUseCase.Command(null, false, null, "legacy-shared-ticket", null, UUID.randomUUID()))))
                .isInstanceOf(LogoutSessionService.Rejected.class);

        assertFamilyUntouched(first, ticket);
        assertFamilyUntouched(second, ticket);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry", Integer.class)).isZero();
    }

    private void resetTo(String targetVersion) {
        var dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(false).load().clean();
        var migration = Flyway.configure().dataSource(dataSource).locations("classpath:db/migration");
        if (targetVersion != null) migration.target(targetVersion);
        migration.load().migrate();
        jdbc = new JdbcTemplate(dataSource);
        tx = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    private UUID insertMobileFamily(byte[] ticket) {
        UUID tenant = UUID.randomUUID();
        UUID account = UUID.randomUUID();
        UUID family = UUID.randomUUID();
        jdbc.update("INSERT INTO tenancy_company(id,status,created_at,updated_at) VALUES (?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", tenant);
        jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES (?,?,?,'SELLER',?,'ACTIVE','User',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", account, account + "@example.test", "$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe", tenant, account + "@example.test");
        jdbc.update("INSERT INTO identity_access_session_family(id,account_id,company_id,channel,client_instance_digest,refresh_token_digest,revocation_ticket_digest,expires_at,created_at) VALUES (?,?,?,'MOBILE',?,?,?,?,?)", family, account, tenant, hmac("client-" + family), hmac("refresh-" + family), ticket, java.sql.Timestamp.from(now.plusSeconds(3600)), java.sql.Timestamp.from(now));
        return family;
    }

    private void assertFamilyUntouched(UUID family, byte[] ticket) {
        assertThat(jdbc.queryForObject("SELECT revoked_at IS NULL FROM identity_access_session_family WHERE id=?", Boolean.class, family)).isTrue();
        assertThat(jdbc.queryForObject("SELECT revocation_ticket_digest FROM identity_access_session_family WHERE id=?", byte[].class, family)).isEqualTo(ticket);
    }

    private static byte[] hmac(String value) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(KEY, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }
}
