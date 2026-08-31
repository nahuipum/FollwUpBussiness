package com.nahui.followupbussiness.customers.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nahui.followupbussiness.customers.adapter.in.rest.CustomerController;
import com.nahui.followupbussiness.customers.adapter.in.rest.CustomerValidationErrorHandler;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerActivityStore;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerPortfolioStore;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerStore;
import com.nahui.followupbussiness.customers.application.CustomerPortfolioAssignmentService;
import com.nahui.followupbussiness.customers.application.CustomerPortfolioReadService;
import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.application.UpdateCustomerService;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioAssignmentUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcSellerStore;
import com.nahui.followupbussiness.workforce.application.PortfolioAccessScopeService;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
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
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CustomerPortfolioReadIntegrationTest {
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
    private JdbcTemplate jdbc;
    private UUID tenantA, tenantB, adminA, supervisorA, sellerA, sellerOther, inactiveSeller, customerA, customerOther, customerB;

    @BeforeAll
    static void start() {
        postgres.start();
    }

    @AfterAll
    static void stop() {
        postgres.stop();
    }

    @BeforeEach
    void migrate() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").cleanDisabled(false).load().clean();
        Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()).locations("classpath:db/migration").load().migrate();
        jdbc = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()));
        tenantA = company();
        tenantB = company();
        adminA = account(tenantA, "COMPANY_ADMIN");
        supervisorA = account(tenantA, "SUPERVISOR");
        UUID otherSupervisor = account(tenantA, "SUPERVISOR");
        UUID sellerUser = account(tenantA, "SELLER");
        UUID otherUser = account(tenantA, "SELLER");
        UUID inactiveUser = account(tenantA, "SELLER");
        account(tenantB, "COMPANY_ADMIN");
        UUID foreignSupervisor = account(tenantB, "SUPERVISOR");
        UUID foreignUser = account(tenantB, "SELLER");
        sellerA = seller(tenantA, sellerUser, supervisorA, "ACTIVE");
        sellerOther = seller(tenantA, otherUser, otherSupervisor, "ACTIVE");
        inactiveSeller = seller(tenantA, inactiveUser, supervisorA, "INACTIVE");
        UUID foreignSeller = seller(tenantB, foreignUser, foreignSupervisor, "ACTIVE");
        customerA = customer(tenantA, "Alpha");
        customerOther = customer(tenantA, "Bravo");
        customerB = customer(tenantB, "Foreign");
        assign(tenantA, customerA, sellerA);
        assign(tenantA, customerOther, sellerOther);
        assign(tenantB, customerB, foreignSeller);
        jdbc.update("insert into customer_activity_fact(tenant_id,customer_id,last_completed_visit_at,last_confirmed_purchase_at) values(?,?,?,?)", tenantA, customerA, java.sql.Timestamp.from(Instant.parse("2026-01-01T00:00:00Z")), null);
    }

    @Test
    void scopesTenantThenCurrentPortfolioThenFiltersCountAndPaginationWithoutWrites() {
        CustomerPortfolioReadService read = read();
        PortfolioAccessScopeService scopes = scopes();
        long before = writes();
        var admin = read.read(query(null, 0, 1), scope(scopes.resolve(actor(adminA, tenantA, BaseRole.COMPANY_ADMIN))));
        var supervisor = read.read(query(null, 0, 20), scope(scopes.resolve(actor(supervisorA, tenantA, BaseRole.SUPERVISOR))));
        var seller = read.read(query(null, 0, 20), scope(scopes.resolve(actor(accountForSeller(sellerA), tenantA, BaseRole.SELLER))));
        assertThat(admin.total()).isEqualTo(2);
        assertThat(admin.items()).extracting(c -> c.customer().id()).containsExactly(customerA);
        assertThat(supervisor.items()).extracting(c -> c.customer().id()).containsExactly(customerA);
        assertThat(seller.items()).extracting(c -> c.customer().id()).containsExactly(customerA);
        assertThat(writes()).isEqualTo(before);
    }

    @Test
    void searchesByNameOrSegmentInsideTheResolvedTenantScope() {
        jdbc.update("update customer set segment='MAYORISTA' where id=?", customerOther);
        CustomerPortfolioReadService read = read();
        var adminScope = new CustomerPortfolioReadUseCase.Scope(tenantA, true, Set.of());

        var byName = read.read(new CustomerPortfolioReadUseCase.Query("alp", null, null, null, null, null, null, 0, 20), adminScope);
        var bySegment = read.read(new CustomerPortfolioReadUseCase.Query("mayor", null, null, null, null, null, null, 0, 20), adminScope);

        assertThat(byName.items()).extracting(c -> c.customer().id()).containsExactly(customerA);
        assertThat(bySegment.items()).extracting(c -> c.customer().id()).containsExactly(customerOther);
        assertThat(bySegment.items()).extracting(c -> c.customer().id()).doesNotContain(customerB);
    }

    @Test
    void sellerFilteredCandidatesRequireTheSellersActiveTerritoryAndKeepPaginationCount() {
        UUID assignedTerritory = territory(tenantA, "Assigned");
        UUID foreignTerritory = territory(tenantA, "Foreign");
        jdbc.update("insert into workforce_seller_territory(seller_id,territory_id) values(?,?)", sellerA, assignedTerritory);
        jdbc.update("update customer set territory_id=? where id=?", assignedTerritory, customerA);
        jdbc.update("update customer set territory_id=? where id=?", foreignTerritory, customerOther);
        CustomerPortfolioReadService read = read();
        var page = read.read(query(sellerA, 0, 1), new CustomerPortfolioReadUseCase.Scope(tenantA, true, Set.of()));

        assertThat(page.total()).isEqualTo(1);
        assertThat(page.items()).extracting(detail -> detail.customer().id()).containsExactly(customerA).doesNotContain(customerOther);
    }

    @Test
    void getsOnlyTheSelectedCustomerReachableByTenantAndPortfolio() {
        CustomerPortfolioReadService read = read();
        PortfolioAccessScopeService scopes = scopes();
        var supervisor = scope(scopes.resolve(actor(supervisorA, tenantA, BaseRole.SUPERVISOR)));
        var admin = scope(scopes.resolve(actor(adminA, tenantA, BaseRole.COMPANY_ADMIN)));

        assertThat(read.get(customerA, supervisor)).hasValueSatisfying(detail -> {
            assertThat(detail.customer().id()).isEqualTo(customerA);
            assertThat(detail.assignedSellerIds()).containsExactly(sellerA);
        });
        assertThat(read.get(customerOther, supervisor)).isEmpty();
        assertThat(read.get(customerB, admin)).isEmpty();
    }

    @Test
    void httpEndpointsExposeOnlyTheSupervisorsCurrentTeamAndHideUnassignedOrForeignCustomers() throws Exception {
        UUID unassigned = customer(tenantA, "Unassigned HTTP");
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new CustomerController(
                        mock(CreateCustomerService.class), mock(UpdateCustomerService.class), mock(CheckCustomerDuplicatesService.class),
                        read(), scopes()))
                .setControllerAdvice(new CustomerValidationErrorHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                actor(supervisorA, tenantA, BaseRole.SUPERVISOR), "test", java.util.List.of()));
        try {
            mvc.perform(get("/customers"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.page.totalElements").value(1))
                    .andExpect(jsonPath("$.items[0].id").value(customerA.toString()));
            mvc.perform(get("/customers/{customerId}", customerA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(customerA.toString()));
            mvc.perform(get("/customers/{customerId}", unassigned))
                    .andExpect(status().isNotFound());
            mvc.perform(get("/customers/{customerId}", customerB))
                    .andExpect(status().isNotFound());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void bulkReadsCurrentAssignmentsOnlyWithinTheRequestedTenant() {
        var assignments = new JdbcCustomerPortfolioStore(jdbc).current(tenantA, java.util.List.of(customerA, customerOther, customerB));

        assertThat(assignments).containsOnlyKeys(customerA, customerOther);
        assertThat(assignments.get(customerA)).extracting(entry -> entry.sellerId()).containsExactly(sellerA);
        assertThat(assignments.get(customerOther)).extracting(entry -> entry.sellerId()).containsExactly(sellerOther);
    }

    @Test
    void excludesFutureAssignmentsFromPortfolioScopeFiltersAndDetail() {
        UUID scheduled = customer(tenantA, "Scheduled");
        jdbc.update("insert into customer_portfolio_assignment(tenant_id,customer_id,seller_id,effective_from,assigned_by,created_at) values(?,?,?,current_date + 1,?,current_timestamp)", tenantA, scheduled, sellerA, accountForSeller(sellerA));
        CustomerPortfolioReadService read = read();
        var sellerScope = new CustomerPortfolioReadUseCase.Scope(tenantA, false, Set.of(sellerA));

        assertThat(read.read(query(null, 0, 20), sellerScope).items()).extracting(detail -> detail.customer().id())
                .doesNotContain(scheduled);
        assertThat(read.get(scheduled, sellerScope)).isEmpty();
        assertThat(new JdbcCustomerPortfolioStore(jdbc).current(tenantA, scheduled)).isEmpty();
    }

    @Test
    void rejectsCrossTenantAndInactiveOrUnknownSellerFiltersAndUsesUtcActivityBoundary() {
        CustomerPortfolioReadService read = read();
        PortfolioAccessScopeService scopes = scopes();
        var supervisor = scope(scopes.resolve(actor(supervisorA, tenantA, BaseRole.SUPERVISOR)));
        assertThatThrownBy(() -> read.read(query(customerB, 0, 20), supervisor)).isInstanceOf(CustomerPortfolioReadUseCase.Forbidden.class);
        assertThatThrownBy(() -> read.read(query(inactiveSeller, 0, 20), supervisor)).isInstanceOf(CustomerPortfolioReadUseCase.Forbidden.class);
        assertThatThrownBy(() -> read.read(query(UUID.randomUUID(), 0, 20), supervisor)).isInstanceOf(CustomerPortfolioReadUseCase.Forbidden.class);
        assertThatThrownBy(() -> scopes.resolve(actor(accountForSeller(inactiveSeller), tenantA, BaseRole.SELLER))).isInstanceOf(com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase.Forbidden.class);
        var absentPurchase = read.read(new CustomerPortfolioReadUseCase.Query(null, null, null, null, null, null, LocalDate.of(2026, 1, 1), 0, 20), scope(scopes.resolve(actor(adminA, tenantA, BaseRole.COMPANY_ADMIN))));
        var inclusiveVisit = read.read(new CustomerPortfolioReadUseCase.Query(null, null, null, null, null, LocalDate.of(2026, 1, 1), null, 0, 20), scope(scopes.resolve(actor(adminA, tenantA, BaseRole.COMPANY_ADMIN))));
        assertThat(absentPurchase.total()).isEqualTo(2);
        assertThat(inclusiveVisit.total()).isEqualTo(1);
    }

    @Test
    void replacementRecordsOneCoherentPreviousToNewSellerTransition() {
        Instant recordedAt = Instant.parse("2026-02-01T10:15:30Z");
        new JdbcCustomerPortfolioStore(jdbc).replace(tenantA, customerA, java.util.Set.of(sellerOther), adminA, LocalDate.of(2026, 2, 1), "reasignacion", recordedAt);
        var history = new JdbcCustomerPortfolioStore(jdbc).history(tenantA, customerA);
        assertThat(history).anySatisfy(entry -> {
            assertThat(entry.previousSellerId()).isEqualTo(sellerA);
            assertThat(entry.newSellerId()).isEqualTo(sellerOther);
            assertThat(entry.actorId()).isEqualTo(adminA);
            assertThat(entry.effectiveFrom()).isEqualTo(LocalDate.of(2026, 2, 1));
            assertThat(entry.reason()).isEqualTo("reasignacion");
            assertThat(entry.recordedAt()).isEqualTo(recordedAt);
        });
        assertThat(history).noneMatch(entry -> entry.previousSellerId() == null || entry.newSellerId() == null);
    }

    @Test
    void schedulesReplacementWithoutRemovingCurrentPortfolioBeforeItsEffectiveDate() {
        LocalDate effectiveFrom = LocalDate.now().plusDays(1);
        new JdbcCustomerPortfolioStore(jdbc).replace(tenantA, customerA, Set.of(sellerOther), adminA, effectiveFrom, "programada", Instant.parse("2026-02-01T10:15:30Z"));

        assertThat(new JdbcCustomerPortfolioStore(jdbc).current(tenantA, customerA)).extracting(entry -> entry.sellerId()).containsExactly(sellerA);
        assertThat(jdbc.queryForObject("select effective_to from customer_portfolio_assignment where tenant_id=? and customer_id=? and seller_id=?", LocalDate.class, tenantA, customerA, sellerA)).isEqualTo(effectiveFrom);
        assertThat(jdbc.queryForObject("select effective_from from customer_portfolio_assignment where tenant_id=? and customer_id=? and seller_id=?", LocalDate.class, tenantA, customerA, sellerOther)).isEqualTo(effectiveFrom);
        assertThat(jdbc.queryForObject("select count(*) from customer_portfolio_assignment where tenant_id=? and customer_id=? and effective_from<=? and (effective_to is null or effective_to>?)", Integer.class, tenantA, customerA, effectiveFrom, effectiveFrom)).isEqualTo(1);
    }

    @Test
    void permitsInitialSchedulingAndRejectsFurtherFutureSchedulesWithoutWritesOrSuccessfulAudit() {
        int[] successfulAudits = {0};
        var service = new CustomerPortfolioAssignmentService(new JdbcCustomerStore(jdbc), new JdbcCustomerPortfolioStore(jdbc),
                (tenantId, sellerIds) -> true, command -> { successfulAudits[0]++; return true; }, java.time.Clock.systemUTC());
        LocalDate firstDate = LocalDate.now().plusDays(1);
        service.assign(new CustomerPortfolioAssignmentUseCase.Command(customerA, Set.of(sellerOther), firstDate, "primera"), actor(adminA, tenantA, BaseRole.COMPANY_ADMIN));
        long assignments = jdbc.queryForObject("select count(*) from customer_portfolio_assignment where tenant_id=? and customer_id=?", Long.class, tenantA, customerA);
        long history = jdbc.queryForObject("select count(*) from customer_portfolio_history where tenant_id=? and customer_id=?", Long.class, tenantA, customerA);

        assertThatThrownBy(() -> service.assign(new CustomerPortfolioAssignmentUseCase.Command(customerA, Set.of(sellerOther), firstDate, "misma fecha"), actor(adminA, tenantA, BaseRole.COMPANY_ADMIN)))
                .isInstanceOf(CustomerPortfolioAssignmentUseCase.Conflict.class);
        assertThatThrownBy(() -> service.assign(new CustomerPortfolioAssignmentUseCase.Command(customerA, Set.of(sellerA), firstDate.plusDays(1), "fecha distinta"), actor(adminA, tenantA, BaseRole.COMPANY_ADMIN)))
                .isInstanceOf(CustomerPortfolioAssignmentUseCase.Conflict.class);

        assertThat(jdbc.queryForObject("select count(*) from customer_portfolio_assignment where tenant_id=? and customer_id=?", Long.class, tenantA, customerA)).isEqualTo(assignments);
        assertThat(jdbc.queryForObject("select count(*) from customer_portfolio_history where tenant_id=? and customer_id=?", Long.class, tenantA, customerA)).isEqualTo(history);
        assertThat(successfulAudits[0]).isEqualTo(1);
    }

    @Test
    void scopesSupervisorToActiveTeamPortfoliosBeforeCountAndPagination() {
        CustomerPortfolioReadService read = read();
        PortfolioAccessScopeService scopes = scopes();
        var supervisor = actor(supervisorA, tenantA, BaseRole.SUPERVISOR);
        UUID sellerTeam = seller(tenantA, account(tenantA, "SELLER"), supervisorA, "ACTIVE");
        UUID customerTeam = customer(tenantA, "Bravo team");
        UUID customerInactive = customer(tenantA, "Inactive portfolio");
        UUID customerUnassigned = customer(tenantA, "Unassigned");
        assign(tenantA, customerTeam, sellerTeam);
        assign(tenantA, customerInactive, inactiveSeller);
        var resolvedScope = scope(scopes.resolve(supervisor));

        var firstPage = read.read(query(null, 0, 1), resolvedScope);
        var secondPage = read.read(query(null, 1, 1), resolvedScope);
        var fullPage = read.read(query(null, 0, 20), resolvedScope);

        assertThat(fullPage.total()).isEqualTo(2);
        assertThat(fullPage.items()).extracting(customer -> customer.customer().id())
                .containsExactly(customerA, customerTeam)
                .doesNotContain(customerOther, customerInactive, customerUnassigned, customerB);
        assertThat(firstPage.total()).isEqualTo(2);
        assertThat(firstPage.items()).extracting(customer -> customer.customer().id()).containsExactly(customerA);
        assertThat(secondPage.total()).isEqualTo(2);
        assertThat(secondPage.items()).extracting(customer -> customer.customer().id()).containsExactly(customerTeam);

        UUID supervisorWithoutTeam = account(tenantA, "SUPERVISOR");
        var emptyPage = read.read(query(null, 0, 20), scope(scopes.resolve(actor(supervisorWithoutTeam, tenantA, BaseRole.SUPERVISOR))));
        assertThat(emptyPage.items()).isEmpty();
        assertThat(emptyPage.total()).isZero();
        assertThatThrownBy(() -> scopes.resolve(actor(UUID.randomUUID(), tenantA, BaseRole.PLATFORM_SUPERADMIN)))
                .isInstanceOf(com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase.Forbidden.class);
    }

    private CustomerPortfolioReadService read() {
        return new CustomerPortfolioReadService(new JdbcCustomerPortfolioStore(jdbc), new JdbcCustomerActivityStore(jdbc), new JdbcCustomerStore(jdbc));
    }

    private PortfolioAccessScopeService scopes() {
        return new PortfolioAccessScopeService(new JdbcSellerStore(jdbc));
    }

    private CustomerPortfolioReadUseCase.Scope scope(com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase.Scope s) {
        return new CustomerPortfolioReadUseCase.Scope(s.tenantId(), s.allCurrentPortfolios(), s.sellerIds());
    }

    private CustomerPortfolioReadUseCase.Query query(UUID seller, int offset, int limit) {
        return new CustomerPortfolioReadUseCase.Query(null, null, null, seller, null, null, null, offset, limit);
    }

    private UUID company() {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into tenancy_company(id,status,created_at,updated_at) values(?,'ACTIVE',current_timestamp,current_timestamp)", id);
        return id;
    }

    private UUID account(UUID tenant, String role) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into identity_access_account(id,login_identifier,password_hash,role_code,company_id,created_at,status,updated_at) values(?,?,?,?,?,current_timestamp,'ACTIVE',current_timestamp)", id, id + "@test.local", "$2a$12$" + "a".repeat(53), role, tenant);
        return id;
    }

    private UUID seller(UUID tenant, UUID user, UUID supervisor, String status) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into workforce_seller(id,tenant_id,user_id,display_name,email,supervisor_id,status,created_at,updated_at,version) values(?,?,?,?,?,?,?,current_timestamp,current_timestamp,1)", id, tenant, user, id.toString(), id + "@test.local", supervisor, status);
        return id;
    }

    private UUID customer(UUID tenant, String name) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into customer(id,tenant_id,name,segment,address,location,status,created_at,updated_at,version) values(?,?,?,'STANDARD','Address',ST_SetSRID(ST_MakePoint(-77.1,-12.1),4326),'ACTIVE',current_timestamp,current_timestamp,1)", id, tenant, name);
        return id;
    }

    private UUID territory(UUID tenant, String name) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into workforce_territory(id,tenant_id,name,status,created_at,updated_at,version) values(?,?,?,'ACTIVE',current_timestamp,current_timestamp,1)", id, tenant, name);
        return id;
    }

    private void assign(UUID tenant, UUID customer, UUID seller) {
        jdbc.update("insert into customer_portfolio_assignment(tenant_id,customer_id,seller_id,effective_from,assigned_by,created_at) values(?,?,?,current_date,?,current_timestamp)", tenant, customer, seller, accountForSeller(seller));
    }

    private UUID accountForSeller(UUID seller) {
        return jdbc.queryForObject("select user_id from workforce_seller where id=?", UUID.class, seller);
    }

    private AuthenticatedActor actor(UUID account, UUID tenant, BaseRole role) {
        return new AuthenticatedActor(account, tenant, role);
    }

    private long writes() {
        return jdbc.queryForObject("select (select count(*) from customer) + (select count(*) from customer_portfolio_assignment) + (select count(*) from customer_activity_fact)", Long.class);
    }
}
