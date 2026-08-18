package com.nahui.followupbussiness.customers.adapter.in.rest;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.application.UpdateCustomerService;
import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;

import java.time.Instant;
import java.util.*;

import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CustomerControllerTest {
    private CreateCustomerService service;
    private UpdateCustomerService updates;
    private CheckCustomerDuplicatesService duplicates;
    private CustomerPortfolioReadUseCase portfolio;
    private PortfolioAccessScopeUseCase scopes;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(CreateCustomerService.class);
        updates = mock(UpdateCustomerService.class);
        duplicates = mock(CheckCustomerDuplicatesService.class);
        portfolio = mock(CustomerPortfolioReadUseCase.class);
        scopes = mock(PortfolioAccessScopeUseCase.class);
        mvc = MockMvcBuilders.standaloneSetup(new CustomerController(service, updates, duplicates, portfolio, scopes)).setControllerAdvice(new CustomerValidationErrorHandler()).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listsOnlyWithResolvedScopeAndPreservesPageContract() throws Exception {
        UUID tenant = UUID.randomUUID(), seller = UUID.randomUUID(), customer = UUID.randomUUID();
        authenticate(tenant, BaseRole.SELLER);
        when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant, false, Set.of(seller)));
        when(portfolio.read(any(), any())).thenReturn(new CustomerPortfolioReadUseCase.Page(List.of(new Customer(customer, tenant, "Customer", null, null, null, null, "STANDARD", "Address", new GeoPoint(-12.1, -77.1), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, 1)), 1));
        mvc.perform(get("/customers").param("page", "1").param("pageSize", "20").param("sellerId", seller.toString()).param("withoutVisitSince", "2026-01-01")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").value(customer.toString())).andExpect(jsonPath("$.page.page").value(1)).andExpect(jsonPath("$.page.totalElements").value(1));
        verify(scopes).resolve(any());
        verify(portfolio).read(argThat(q -> q.offset() == 20 && q.sellerId().equals(seller)), any());
    }

    @Test
    void rejectsInvalidListingBeforeReadingPortsAndMapsDeniedScope() throws Exception {
        authenticate(UUID.randomUUID(), BaseRole.SELLER);
        mvc.perform(get("/customers").param("pageSize", "201")).andExpect(status().isBadRequest());
        verifyNoInteractions(scopes, portfolio);
        when(scopes.resolve(any())).thenThrow(new PortfolioAccessScopeUseCase.Forbidden());
        mvc.perform(get("/customers")).andExpect(status().isForbidden()).andExpect(jsonPath("$.detail").value("Request cannot be processed"));
        verifyNoInteractions(portfolio);
    }

    @Test
    void createsOnlyForSessionAdminAndRejectsUnknownProperties() throws Exception {
        UUID tenant = UUID.randomUUID();
        authenticate(tenant, BaseRole.COMPANY_ADMIN);
        UUID id = UUID.randomUUID();
        when(service.create(any(), any())).thenReturn(new Customer(id, tenant, "Customer", null, null, null, null, "STANDARD", "Address", new GeoPoint(-12.1, -77.1), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, 1));
        mvc.perform(post("/customers").contentType(MediaType.APPLICATION_JSON).content(valid())).andExpect(status().isCreated()).andExpect(header().exists("X-Correlation-Id")).andExpect(jsonPath("$.id").value(id.toString()));
        mvc.perform(post("/customers").contentType(MediaType.APPLICATION_JSON).content(valid().replace("}", ",\"tenantId\":\"" + UUID.randomUUID() + "\"}"))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void mapsForbiddenWithoutCallingPersistenceUseCase() throws Exception {
        authenticate(UUID.randomUUID(), BaseRole.SELLER);
        when(service.create(any(), any())).thenThrow(new CreateCustomerService.Forbidden());
        mvc.perform(post("/customers").contentType(MediaType.APPLICATION_JSON).content(valid())).andExpect(status().isForbidden()).andExpect(header().exists("X-Correlation-Id"));
    }

    @Test
    void rejectsNullPatchCoordinatesWithoutCallingUpdateService() throws Exception {
        authenticate(UUID.randomUUID(), BaseRole.COMPANY_ADMIN);
        var request = patch("/customers/{id}", UUID.randomUUID()).header("If-Match", "\"1\"").contentType(MediaType.APPLICATION_JSON).content("{\"location\":{\"latitude\":null,\"longitude\":-77}}");
        mvc.perform(request).andExpect(status().isBadRequest()).andExpect(jsonPath("$.correlationId").exists());
        verifyNoInteractions(updates);
    }

    @Test
    void mapsCrossTenantAdminPatchToGenericNotFoundWithoutDetails() throws Exception {
        authenticate(UUID.randomUUID(), BaseRole.COMPANY_ADMIN);
        when(updates.update(any(), anyLong(), any(), any())).thenThrow(new UpdateCustomerService.NotFound());
        mvc.perform(patch("/customers/{id}", UUID.randomUUID()).header("If-Match", "\"1\"").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Updated\"}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.detail").value("Request cannot be processed")).andExpect(jsonPath("$.location").doesNotExist()).andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    void mapsOwnerSupervisorPatchToForbidden() throws Exception {
        authenticate(UUID.randomUUID(), BaseRole.SUPERVISOR);
        when(updates.update(any(), anyLong(), any(), any())).thenThrow(new UpdateCustomerService.Forbidden());
        mvc.perform(patch("/customers/{id}", UUID.randomUUID()).header("If-Match", "\"1\"").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Updated\"}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.detail").value("Request cannot be processed"));
    }

    @Test
    void duplicateCheckReturnsOnlyUseCaseCandidatesAndMapsForbidden() throws Exception {
        UUID tenant = UUID.randomUUID();
        authenticate(tenant, BaseRole.COMPANY_ADMIN);
        UUID id = UUID.randomUUID();
        Customer candidate = new Customer(id, tenant, "Customer", null, null, null, null, "STANDARD", "Address", new GeoPoint(-12.1, -77.1), null, null, "ACTIVE", Instant.EPOCH, Instant.EPOCH, 1);
        when(duplicates.check(any(), any())).thenReturn(new CheckCustomerDuplicatesService.Result(List.of(new CheckCustomerDuplicatesService.Candidate(candidate, Set.of(com.nahui.followupbussiness.customers.application.port.out.CustomerStore.MatchedField.NAME), .2d))));
        mvc.perform(post("/customers/duplicate-checks").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Customer\"}"))
                .andExpect(status().isOk()).andExpect(header().exists("X-Correlation-Id")).andExpect(jsonPath("$.hasPossibleDuplicates").value(true)).andExpect(jsonPath("$.candidates[0].score").value(.2d)).andExpect(jsonPath("$.candidates[0].matchedFields[0]").value("NAME"));
        authenticate(tenant, BaseRole.SELLER);
        when(duplicates.check(any(), any())).thenThrow(new CheckCustomerDuplicatesService.Forbidden());
        mvc.perform(post("/customers/duplicate-checks").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Customer\"}")).andExpect(status().isForbidden());
    }

    private void authenticate(UUID tenant, BaseRole role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthenticatedActor(UUID.randomUUID(), tenant, role), "test", List.of()));
    }

    private static String valid() {
        return "{\"name\":\"Customer\",\"address\":\"Address\",\"location\":{\"latitude\":-12.1,\"longitude\":-77.1}}";
    }
}
