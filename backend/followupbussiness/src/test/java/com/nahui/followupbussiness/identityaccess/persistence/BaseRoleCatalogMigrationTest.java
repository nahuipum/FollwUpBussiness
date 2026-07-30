package com.nahui.followupbussiness.identityaccess.persistence;

import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.identityaccess.domain.model.RoleScope;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(OutputCaptureExtension.class)
class BaseRoleCatalogMigrationTest {

    private static final String DATABASE_PASSWORD =
            "EN011_TEST_ONLY_DATABASE_PASSWORD_0123456789";
    private static final DockerImageName POSTGIS_IMAGE =
            DockerImageName.parse("postgis/postgis:17-3.5")
                    .asCompatibleSubstituteFor("postgres");

    private static PostgreSQLContainer postgres;
    private Flyway flyway;

    @BeforeAll
    static void startPostgres() {
        postgres = new PostgreSQLContainer(POSTGIS_IMAGE)
                .withDatabaseName("fieldsales_en011")
                .withUsername("fieldsales_en011")
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
        flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();
        flyway.clean();
        flyway.migrate();
    }

    @Test
    void cleanDatabaseContainsExactlyTheDomainCatalog() throws SQLException {
        Map<String, RoleRow> expected = new LinkedHashMap<>();
        for (BaseRole role : BaseRole.values()) {
            expected.put(role.code(), new RoleRow(role.scope().name(), 1));
        }

        assertThat(readRoles()).containsExactlyInAnyOrderEntriesOf(expected);
    }

    @Test
    void flywayAndSeedExecutionAreRepeatableWithoutDuplicates() throws Exception {
        MigrateResult secondMigration = flyway.migrate();
        executeSql(resourceText("/db/migration/R__seed_identity_access_base_roles.sql"));
        executeSql(resourceText("/db/migration/R__seed_identity_access_base_roles.sql"));

        assertThat(secondMigration.migrationsExecuted).isZero();
        assertThat(readRoles()).hasSize(4);
        assertThat(countRows()).isEqualTo(4);
    }

    @Test
    void databaseRejectsUnknownCodesDuplicatesAndInvalidScopes() {
        assertThatThrownBy(() -> executeSql(
                "INSERT INTO identity_access_role_catalog(code, scope, catalog_version) "
                        + "VALUES ('ARBITRARY_ADMIN', 'COMPANY', 1)"))
                .isInstanceOf(SQLException.class);

        assertThatThrownBy(() -> executeSql(
                "INSERT INTO identity_access_role_catalog(code, scope, catalog_version) "
                        + "VALUES ('SELLER', 'COMPANY', 1)"))
                .isInstanceOf(SQLException.class);

        assertThatThrownBy(() -> executeSql(
                "UPDATE identity_access_role_catalog SET scope = 'PLATFORM' WHERE code = 'SELLER'"))
                .isInstanceOf(SQLException.class);
    }

    @Test
    void migrationLogsDoNotExposeDatabasePassword(CapturedOutput output) {
        flyway.validate();

        assertThat(output.getAll()).doesNotContain(DATABASE_PASSWORD);
    }

    private Map<String, RoleRow> readRoles() throws SQLException {
        String sql = """
                SELECT code, scope, catalog_version
                FROM identity_access_role_catalog
                ORDER BY code
                """;
        Map<String, RoleRow> roles = new LinkedHashMap<>();
        try (Connection connection = connection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                roles.put(
                        resultSet.getString("code"),
                        new RoleRow(
                                resultSet.getString("scope"),
                                resultSet.getInt("catalog_version")));
            }
        }
        return roles;
    }

    private long countRows() throws SQLException {
        try (Connection connection = connection();
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(
                        "SELECT COUNT(*) FROM identity_access_role_catalog")) {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }

    private void executeSql(String sql) throws SQLException {
        try (Connection connection = connection();
                Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private Connection connection() throws SQLException {
        return DriverManager.getConnection(
                postgres.getJdbcUrl(),
                postgres.getUsername(),
                postgres.getPassword());
    }

    private static String resourceText(String resourcePath) throws IOException {
        try (InputStream input = BaseRoleCatalogMigrationTest.class.getResourceAsStream(resourcePath)) {
            if (input == null) {
                throw new IOException("Migration resource was not found: " + resourcePath);
            }
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private record RoleRow(String scope, int catalogVersion) {

        private RoleRow {
            assertThat(RoleScope.valueOf(scope)).isNotNull();
        }
    }
}
