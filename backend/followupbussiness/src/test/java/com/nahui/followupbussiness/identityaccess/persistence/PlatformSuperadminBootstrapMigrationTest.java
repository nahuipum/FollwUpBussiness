package com.nahui.followupbussiness.identityaccess.persistence;

import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcBootstrapAuditAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPlatformSuperadminAccountRepository;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcLoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcSessionFamilyAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.security.BCryptPasswordHashingAdapter;
import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminCommand;
import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminResult;
import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminService;
import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(OutputCaptureExtension.class)
class PlatformSuperadminBootstrapMigrationTest {

    private static final DockerImageName POSTGIS_IMAGE =
            DockerImageName.parse("postgis/postgis:17-3.5")
                    .asCompatibleSubstituteFor("postgres");
    private static final String DATABASE_PASSWORD = UUID.randomUUID() + "!" + UUID.randomUUID();

    private static PostgreSQLContainer postgres;

    private JdbcTemplate jdbcTemplate;
    private BootstrapPlatformSuperadminUseCase useCase;

    @BeforeAll
    static void startPostgres() {
        postgres = new PostgreSQLContainer(POSTGIS_IMAGE)
                .withDatabaseName("followupbussiness_en012")
                .withUsername("followupbussiness_en012")
                .withPassword(DATABASE_PASSWORD);
        postgres.start();
    }

    @AfterAll
    static void stopPostgres() {
        if (postgres != null) {
            postgres.stop();
        }
    }

    @BeforeEach
    void migrateCleanDatabase() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                postgres.getJdbcUrl(),
                postgres.getUsername(),
                postgres.getPassword());
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();
        flyway.clean();
        flyway.migrate();

        jdbcTemplate = new JdbcTemplate(dataSource);
        BootstrapPlatformSuperadminService service = new BootstrapPlatformSuperadminService(
                new JdbcPlatformSuperadminAccountRepository(jdbcTemplate),
                new BCryptPasswordHashingAdapter(),
                new JdbcBootstrapAuditAdapter(jdbcTemplate),
                Clock.systemUTC(),
                UUID::randomUUID);
        TransactionTemplate transactionTemplate =
                new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        useCase = command -> Objects.requireNonNull(
                transactionTemplate.execute(status -> service.execute(command)));
    }

    @Test
    void controlledExecutionPersistsSafeHashPlatformRoleNoCompanyAndSafeAudit(
            CapturedOutput output) {
        LoginIdentifier identity = randomIdentity();
        char[] rawPassword = randomPassword();

        BootstrapPlatformSuperadminResult result;
        try {
            result = execute(identity, rawPassword);
        } finally {
            Arrays.fill(rawPassword, '\0');
        }

        Map<String, Object> account = jdbcTemplate.queryForMap(
                """
                SELECT id, login_identifier, password_hash, role_code, company_id, display_name, email
                FROM identity_access_account
                """);
        String passwordHash = account.get("password_hash").toString();
        assertThat(result.status()).isEqualTo(BootstrapPlatformSuperadminResult.Status.CREATED);
        assertThat(account.get("role_code")).isEqualTo("PLATFORM_SUPERADMIN");
        assertThat(account.get("company_id")).isNull();
        assertThat(account).containsEntry("display_name", "Platform Administrator")
                .containsEntry("email", "bootstrap@invalid.example");
        assertThat(passwordHash).startsWith("$2").contains("$12$");
        assertThat(new BCryptPasswordEncoder().matches(
                lastPasswordForVerification(identity),
                passwordHash)).isFalse();

        Map<String, Object> audit = jdbcTemplate.queryForMap(
                """
                SELECT operation, result, correlation_id, account_id
                FROM identity_access_bootstrap_audit
                """);
        assertThat(audit)
                .containsEntry("operation", "PLATFORM_SUPERADMIN_BOOTSTRAP")
                .containsEntry("result", "CREATED");
        assertThat(audit.get("correlation_id")).isEqualTo(result.correlationId());
        assertThat(audit.get("account_id")).isEqualTo(result.accountId());
        assertThat(audit.keySet())
                .doesNotContain("login_identifier", "password", "password_hash", "secret", "token");
        assertThat(output.getAll()).doesNotContain(DATABASE_PASSWORD);
    }

    @Test
    void v5PersistsBootstrapProfileAndPlatformSessionFamily() {
        LoginIdentifier identity = randomIdentity();
        char[] password = randomPassword();
        BootstrapPlatformSuperadminResult result;
        try {
            result = execute(identity, password);
        } finally {
            Arrays.fill(password, '\0');
        }
        UUID familyId = UUID.randomUUID();
        Instant now = Instant.now();
        new JdbcSessionFamilyAdapter(jdbcTemplate).create(
                familyId, result.accountId(), null, "WEB", new byte[] {1}, new byte[] {2}, new byte[] {3}, null,
                now.plusSeconds(60), now);

        Map<String, Object> family = jdbcTemplate.queryForMap(
                "SELECT account_id, company_id, channel, client_instance_digest, refresh_token_digest, csrf_token_digest "
                        + "FROM identity_access_session_family WHERE id = ?", familyId);
        assertThat(family).containsEntry("account_id", result.accountId())
                .containsEntry("channel", "WEB");
        assertThat(family.get("company_id")).isNull();
        assertThat((byte[]) family.get("client_instance_digest")).containsExactly((byte) 1);
        assertThat((byte[]) family.get("refresh_token_digest")).containsExactly((byte) 2);
        assertThat((byte[]) family.get("csrf_token_digest")).containsExactly((byte) 3);
    }

    @Test
    void duplicateLoginIdentityAcrossCompaniesIsRejectedInsteadOfSelectingAnArbitraryTenant() {
        String identifier = "shared-" + UUID.randomUUID() + "@invalid.example";
        insertCompanyAccount(identifier, UUID.randomUUID());
        insertCompanyAccount(identifier, UUID.randomUUID());

        assertThat(new JdbcLoginAccountQuery(jdbcTemplate).findByIdentifier(identifier)).isEmpty();
    }

    @Test
    void bcryptHashMatchesOriginalPasswordAndPlaintextIsNeverStored() {
        LoginIdentifier identity = randomIdentity();
        char[] rawPassword = randomPassword();
        String original = new String(rawPassword);

        try {
            execute(identity, rawPassword);
            String storedHash = jdbcTemplate.queryForObject(
                    "SELECT password_hash FROM identity_access_account",
                    String.class);

            assertThat(storedHash).isNotEqualTo(original);
            assertThat(storedHash).doesNotContain(original);
            assertThat(new BCryptPasswordEncoder().matches(original, storedHash)).isTrue();
            Integer plaintextOccurrences = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM identity_access_account
                    WHERE password_hash = ?
                    """,
                    Integer.class,
                    original);
            assertThat(plaintextOccurrences).isZero();
        } finally {
            Arrays.fill(rawPassword, '\0');
        }
    }

    @Test
    void retryKeepsSingleAccountAndOriginalHash() {
        LoginIdentifier identity = randomIdentity();
        char[] firstPassword = randomPassword();
        char[] retryPassword = randomPassword();

        try {
            BootstrapPlatformSuperadminResult created = execute(identity, firstPassword);
            String originalHash = storedHash();
            BootstrapPlatformSuperadminResult retried = execute(identity, retryPassword);

            assertThat(created.status())
                    .isEqualTo(BootstrapPlatformSuperadminResult.Status.CREATED);
            assertThat(retried.status())
                    .isEqualTo(BootstrapPlatformSuperadminResult.Status.ALREADY_PROVISIONED);
            assertThat(retried.accountId()).isEqualTo(created.accountId());
            assertThat(accountCount()).isEqualTo(1);
            assertThat(storedHash()).isEqualTo(originalHash);
            assertThat(auditResults()).containsExactly("CREATED", "ALREADY_PROVISIONED");
        } finally {
            Arrays.fill(firstPassword, '\0');
            Arrays.fill(retryPassword, '\0');
        }
    }

    @Test
    void differentIdentityCannotCreateOrElevateAnotherAccount() {
        LoginIdentifier firstIdentity = randomIdentity();
        LoginIdentifier otherIdentity = randomIdentity();
        char[] firstPassword = randomPassword();
        char[] otherPassword = randomPassword();

        try {
            BootstrapPlatformSuperadminResult created = execute(firstIdentity, firstPassword);
            BootstrapPlatformSuperadminResult conflict = execute(otherIdentity, otherPassword);

            assertThat(created.status())
                    .isEqualTo(BootstrapPlatformSuperadminResult.Status.CREATED);
            assertThat(conflict.status())
                    .isEqualTo(BootstrapPlatformSuperadminResult.Status.CONFLICT);
            assertThat(conflict.accountId()).isEqualTo(created.accountId());
            assertThat(accountCount()).isEqualTo(1);
            assertThat(auditResults()).containsExactly("CREATED", "CONFLICT");
        } finally {
            Arrays.fill(firstPassword, '\0');
            Arrays.fill(otherPassword, '\0');
        }
    }

    @Test
    void concurrentRetryCreatesExactlyOnePrivilegedAccount() throws Exception {
        LoginIdentifier identity = randomIdentity();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<BootstrapPlatformSuperadminResult> first =
                    executor.submit(() -> executeConcurrently(identity, ready, start));
            Future<BootstrapPlatformSuperadminResult> second =
                    executor.submit(() -> executeConcurrently(identity, ready, start));
            ready.await();
            start.countDown();

            assertThat(List.of(first.get().status(), second.get().status()))
                    .containsExactlyInAnyOrder(
                            BootstrapPlatformSuperadminResult.Status.CREATED,
                            BootstrapPlatformSuperadminResult.Status.ALREADY_PROVISIONED);
        }

        assertThat(accountCount()).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM identity_access_account
                WHERE role_code = 'PLATFORM_SUPERADMIN' AND company_id IS NULL
                """,
                Integer.class)).isEqualTo(1);
    }

    @Test
    void databaseConstraintsRejectSecondPlatformAccountCompanyAndNonBcryptHash() {
        LoginIdentifier identity = randomIdentity();
        char[] password = randomPassword();
        try {
            execute(identity, password);
        } finally {
            Arrays.fill(password, '\0');
        }

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO identity_access_account(
                    id, login_identifier, password_hash, role_code, company_id, created_at
                )
                VALUES (?, ?, ?, 'PLATFORM_SUPERADMIN', NULL, CURRENT_TIMESTAMP)
                """,
                UUID.randomUUID(),
                randomIdentity().value(),
                "$2a$12$" + "E".repeat(53)))
                .isInstanceOf(RuntimeException.class);

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO identity_access_account(
                    id, login_identifier, password_hash, role_code, company_id, created_at
                )
                VALUES (?, ?, ?, 'PLATFORM_SUPERADMIN', ?, CURRENT_TIMESTAMP)
                """,
                UUID.randomUUID(),
                randomIdentity().value(),
                "$2a$12$" + "F".repeat(53),
                UUID.randomUUID()))
                .isInstanceOf(RuntimeException.class);

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO identity_access_account(
                    id, login_identifier, password_hash, role_code, company_id, created_at
                )
                VALUES (?, ?, 'plaintext', 'COMPANY_ADMIN', ?, CURRENT_TIMESTAMP)
                """,
                UUID.randomUUID(),
                randomIdentity().value(),
                UUID.randomUUID()))
                .isInstanceOf(RuntimeException.class);
    }

    private BootstrapPlatformSuperadminResult execute(
            LoginIdentifier identity,
            char[] password) {
        try (BootstrapPlatformSuperadminCommand command =
                new BootstrapPlatformSuperadminCommand(
                        identity,
                        password,
                        UUID.randomUUID())) {
            return useCase.execute(command);
        }
    }

    private BootstrapPlatformSuperadminResult executeConcurrently(
            LoginIdentifier identity,
            CountDownLatch ready,
            CountDownLatch start) throws Exception {
        char[] password = randomPassword();
        try {
            ready.countDown();
            start.await();
            return execute(identity, password);
        } finally {
            Arrays.fill(password, '\0');
        }
    }

    private int accountCount() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM identity_access_account",
                Integer.class);
    }

    private void insertCompanyAccount(String identifier, UUID companyId) {
        jdbcTemplate.update(
                "INSERT INTO identity_access_account(id, login_identifier, password_hash, role_code, company_id, created_at, status, display_name, email) "
                        + "VALUES (?, ?, ?, 'SELLER', ?, CURRENT_TIMESTAMP, 'ACTIVE', 'Seller', ?)",
                UUID.randomUUID(), identifier, "$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe", companyId,
                identifier);
    }

    private String storedHash() {
        return jdbcTemplate.queryForObject(
                "SELECT password_hash FROM identity_access_account",
                String.class);
    }

    private List<String> auditResults() {
        return jdbcTemplate.queryForList(
                """
                SELECT result
                FROM identity_access_bootstrap_audit
                ORDER BY occurred_at, id
                """,
                String.class);
    }

    private static LoginIdentifier randomIdentity() {
        return new LoginIdentifier("operator-" + UUID.randomUUID() + "@invalid.example");
    }

    private static char[] randomPassword() {
        return (UUID.randomUUID() + "!Aa123456").toCharArray();
    }

    private static String lastPasswordForVerification(LoginIdentifier identity) {
        return "not-the-password-" + identity.value().length();
    }
}
