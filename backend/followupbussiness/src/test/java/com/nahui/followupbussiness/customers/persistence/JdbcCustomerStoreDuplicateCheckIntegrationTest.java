package com.nahui.followupbussiness.customers.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class JdbcCustomerStoreDuplicateCheckIntegrationTest {
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbc; private UUID tenant; private UUID otherTenant;
    @BeforeAll static void start() { postgres.start(); }
    @AfterAll static void stop() { postgres.stop(); }
    @BeforeEach void migrate() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").cleanDisabled(false).load().clean();
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").load().migrate();
        jdbc = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())); tenant = UUID.randomUUID(); otherTenant = UUID.randomUUID();
        company(tenant); company(otherTenant);
    }
    @Test void usesPostgis100MeterRadiusAndNeverReturnsOtherTenantOrExcludedCustomer() {
        UUID near = customer(tenant, " Same Name ", "12- 3", "9 8-7", " Same Address ", -12.1, -77.1);
        customer(tenant, "Far", null, null, "Elsewhere", -12.102, -77.1);
        UUID foreign = customer(otherTenant, "Same Name", "123", "987", "Same Address", -12.1, -77.1);
        CustomerStore store = new JdbcCustomerStore(jdbc);
        var criteria = new CustomerStore.DuplicateCriteria("same name", "123", "987", "same address", -12.1, -77.1, foreign);
        var matches = store.findDuplicateMatches(tenant, criteria);
        assertThat(matches).hasSize(1); assertThat(matches.getFirst().customer().id()).isEqualTo(near);
        assertThat(matches.getFirst().matchedFields()).containsExactlyInAnyOrder(CustomerStore.MatchedField.DOCUMENT, CustomerStore.MatchedField.PHONE, CustomerStore.MatchedField.NAME, CustomerStore.MatchedField.ADDRESS, CustomerStore.MatchedField.LOCATION);
        assertThat(store.findDuplicateMatches(tenant, new CustomerStore.DuplicateCriteria("same name", null, null, null, null, null, near))).isEmpty();
    }
    private void company(UUID id) { jdbc.update("insert into tenancy_company(id,status,created_at,updated_at) values (?,'ACTIVE',current_timestamp,current_timestamp)", id); }
    private UUID customer(UUID owner, String name, String document, String phone, String address, double latitude, double longitude) {
        UUID id = UUID.randomUUID(); jdbc.update("insert into customer(id,tenant_id,name,document_number,phone,address,location,status,created_at,updated_at,version) values(?,?,?,?,?,?,ST_SetSRID(ST_MakePoint(?,?),4326),'ACTIVE',current_timestamp,current_timestamp,1)", id, owner, name, document, phone, address, longitude, latitude); return id;
    }
}
