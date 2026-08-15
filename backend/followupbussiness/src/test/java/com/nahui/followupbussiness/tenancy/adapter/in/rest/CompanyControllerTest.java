package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.CorrelationIdFilter;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextPlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.ChangeCompanyStatusUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.GetCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.GetCompanyService;
import com.nahui.followupbussiness.tenancy.application.ListCompaniesService;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;

import java.util.List;
import java.util.UUID;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CompanyControllerTest {
    @Test
    void listReturnsTheContractPageAndForwardsFilters() throws Exception {
        ListCompaniesUseCase listUseCase = mock(ListCompaniesUseCase.class);
        var expectedActor = platform();
        when(listUseCase.execute(any(), any())).thenReturn(new ListCompaniesUseCase.Result(
                List.of(company(UUID.fromString("00000000-0000-0000-0000-000000000010"), CompanyStatus.ACTIVE)), 21));
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), mock(ChangeCompanyStatusUseCase.class), listUseCase, expectedActor);

        mvc.perform(get("/platform/companies?page=1&pageSize=20&search=Nahui&status=ACTIVE").header("Authorization", "Bearer valid"))
                .andExpect(status().isOk()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(jsonPath("$.items[0].id").value("00000000-0000-0000-0000-000000000010"))
                .andExpect(jsonPath("$.page.page").value(1)).andExpect(jsonPath("$.page.pageSize").value(20))
                .andExpect(jsonPath("$.page.totalElements").value(21)).andExpect(jsonPath("$.page.totalPages").value(2));
        verify(listUseCase).execute(new ListCompaniesUseCase.Query(1, 20, "Nahui", CompanyStatus.ACTIVE), expectedActor);
    }

    @Test
    void tenantBoundPlatformActorIsDeniedBeforeAnyCompanyListing() throws Exception {
        ListCompaniesUseCase listUseCase = mock(ListCompaniesUseCase.class);
        var actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN);
        when(listUseCase.execute(any(), any())).thenThrow(new ListCompaniesService.AccessDeniedException());
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), mock(ChangeCompanyStatusUseCase.class), listUseCase, actor);

        mvc.perform(get("/platform/companies").header("Authorization", "Bearer valid"))
                .andExpect(status().isForbidden()).andExpect(header().string("Cache-Control", "no-store"));
        verify(listUseCase).execute(new ListCompaniesUseCase.Query(0, 20, null, null), actor);
    }

    @Test
    void listRejectsOutOfContractPageParametersBeforeTheUseCase() throws Exception {
        ListCompaniesUseCase listUseCase = mock(ListCompaniesUseCase.class);
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), mock(ChangeCompanyStatusUseCase.class), listUseCase, platform());

        mvc.perform(get("/platform/companies?page=-1").header("Authorization", "Bearer valid"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(listUseCase);
    }

    @Test
    void postThenDetailAndListExposeTheSameCreatedCompanyId() throws Exception {
        UUID companyId = UUID.randomUUID();
        Company created = company(companyId, CompanyStatus.ACTIVE);
        CreateCompanyUseCase create = (command, actor) -> CreateCompanyUseCase.Result.created(created);
        GetCompanyUseCase detail = (id, actor) -> java.util.Optional.ofNullable(companyId.equals(id) ? created : null);
        ListCompaniesUseCase list = (query, actor) -> new ListCompaniesUseCase.Result(List.of(created), 1);
        MockMvc mvc = mvc(create, mock(ChangeCompanyStatusUseCase.class), list, detail, platform());

        var createdResponse = mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(companyId.toString())).andReturn();
        String location = createdResponse.getResponse().getHeader("Location");
        mvc.perform(get(location).header("Authorization", "Bearer valid"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(companyId.toString()));
        mvc.perform(get("/platform/companies").header("Authorization", "Bearer valid"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").value(companyId.toString()));
    }

    @Test
    void unknownDetailKeepsTheNeutral404Contract() throws Exception {
        GetCompanyUseCase detail = (id, actor) -> java.util.Optional.empty();
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), mock(ChangeCompanyStatusUseCase.class),
                mock(ListCompaniesUseCase.class), detail, platform());
        mvc.perform(get("/platform/companies/{companyId}", UUID.randomUUID()).header("Authorization", "Bearer valid"))
                .andExpect(status().isNotFound()).andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void tenantBoundPlatformActorIsDeniedBeforeAnyCompanyDetail() throws Exception {
        GetCompanyUseCase detail = mock(GetCompanyUseCase.class);
        var actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN);
        when(detail.execute(any(), any())).thenThrow(new GetCompanyService.AccessDeniedException());
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), mock(ChangeCompanyStatusUseCase.class),
                mock(ListCompaniesUseCase.class), detail, actor);
        mvc.perform(get("/platform/companies/{companyId}", UUID.randomUUID()).header("Authorization", "Bearer valid"))
                .andExpect(status().isForbidden()).andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void statusTransitionReturnsTheContractCompanyAndCorrelation() throws Exception {
        UUID companyId = UUID.randomUUID();
        ChangeCompanyStatusUseCase statusUseCase = (id, command, actor) -> ChangeCompanyStatusUseCase.Result.success(company(companyId, command.status()));
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase, platform());
        mvc.perform(patch("/platform/companies/{companyId}/status", companyId).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SUSPENDED\",\"reason\":\"Operational review\"}"))
                .andExpect(status().isOk()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(jsonPath("$.id").value(companyId.toString())).andExpect(jsonPath("$.status").value("SUSPENDED"));
    }

    @Test
    void unknownCompanyKeepsTheNeutral404Contract() throws Exception {
        ChangeCompanyStatusUseCase statusUseCase = (id, command, actor) -> ChangeCompanyStatusUseCase.Result.notFound();
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase, platform());
        mvc.perform(patch("/platform/companies/{companyId}/status", UUID.randomUUID()).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACTIVE\",\"reason\":\"Operational review\"}"))
                .andExpect(status().isNotFound()).andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void deniedStatusTransitionKeepsTheNeutral403Contract() throws Exception {
        ChangeCompanyStatusUseCase statusUseCase = (id, command, actor) -> ChangeCompanyStatusUseCase.Result.deniedResult();
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase,
                new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN));
        mvc.perform(patch("/platform/companies/{companyId}/status", UUID.randomUUID()).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SUSPENDED\",\"reason\":\"Operational review\"}"))
                .andExpect(status().isForbidden()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().exists("X-Correlation-Id"));
    }

    @Test
    void invalidStatusReasonIsRejectedBeforeTheUseCase() throws Exception {
        ChangeCompanyStatusUseCase statusUseCase = mock(ChangeCompanyStatusUseCase.class);
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase, platform());
        mvc.perform(patch("/platform/companies/{companyId}/status", UUID.randomUUID()).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACTIVE\",\"reason\":\"no\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(statusUseCase);
    }

    @Test
    void invalidCorrelationIsRejectedBeforeTheUseCaseWithoutReflection() throws Exception {
        CreateCompanyUseCase useCase = mock(CreateCompanyUseCase.class);
        when(useCase.execute(any(), any())).thenReturn(CreateCompanyUseCase.Result.conflictResult());
        MockMvc mvc = mvc(useCase, platform());
        mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid").header("X-Correlation-Id", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isBadRequest()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value("CORRELATION_ID_INVALID"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("not-a-uuid"))));
        verifyNoInteractions(useCase);
    }

    @Test
    void validCorrelationIsPreservedForResponseAndPlatformAuditContext() throws Exception {
        AtomicReference<UUID> auditCorrelation = new AtomicReference<>();
        UUID supplied = UUID.fromString("a0d0cf0e-7b8c-4143-b983-25d9e166aa30");
        var provider = new SecurityContextPlatformAuditTrustedContextProvider(Clock.systemUTC());
        CreateCompanyUseCase useCase = (command, actor) -> {
            auditCorrelation.set(provider.current().correlationId());
            return CreateCompanyUseCase.Result.conflictResult();
        };
        MockMvc mvc = mvc(useCase, platform());
        var result = mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid").header("X-Correlation-Id", supplied.toString())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isConflict()).andExpect(header().exists("X-Correlation-Id"))
                .andReturn();
        org.assertj.core.api.Assertions.assertThat(result.getResponse().getHeader("X-Correlation-Id"))
                .isEqualTo(supplied.toString()).isEqualTo(auditCorrelation.get().toString());
    }

    @Test
    void companyBoundPlatformRoleIsRejectedByUseCaseBeforePersistence() throws Exception {
        CreateCompanyUseCase useCase = mock(CreateCompanyUseCase.class);
        when(useCase.execute(any(), any())).thenThrow(new com.nahui.followupbussiness.tenancy.application.CreateCompanyService.AccessDeniedException());
        MockMvc mvc = mvc(useCase, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN));
        mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isForbidden()).andExpect(header().exists("X-Correlation-Id"));
    }

    private static MockMvc mvc(CreateCompanyUseCase useCase, AuthenticatedActor actor) {
        ChangeCompanyStatusUseCase statusUseCase = mock(ChangeCompanyStatusUseCase.class);
        return mvc(useCase, statusUseCase, actor);
    }

    private static MockMvc mvc(CreateCompanyUseCase useCase, ChangeCompanyStatusUseCase statusUseCase, AuthenticatedActor actor) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        when(authenticator.authenticate("valid")).thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor, "valid", List.of()));
        return MockMvcBuilders.standaloneSetup(new CompanyController(useCase, statusUseCase)).setControllerAdvice(new CompanyValidationErrorHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new CorrelationIdFilter(), new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint())).build();
    }

    private static MockMvc mvc(CreateCompanyUseCase useCase, ChangeCompanyStatusUseCase statusUseCase,
                               ListCompaniesUseCase listUseCase, AuthenticatedActor actor) {
        return mvc(useCase, statusUseCase, listUseCase,
                (companyId, principal) -> {
                    throw new UnsupportedOperationException("Detail use case is required");
                }, actor);
    }

    private static MockMvc mvc(CreateCompanyUseCase useCase, ChangeCompanyStatusUseCase statusUseCase,
                               ListCompaniesUseCase listUseCase, GetCompanyUseCase detailUseCase, AuthenticatedActor actor) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        when(authenticator.authenticate("valid")).thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor, "valid", List.of()));
        return MockMvcBuilders.standaloneSetup(new CompanyController(useCase, statusUseCase, listUseCase, detailUseCase,
                        principal -> {
                            throw new UnsupportedOperationException("Currency use case is required");
                        })).setControllerAdvice(new CompanyValidationErrorHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new CorrelationIdFilter(), new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint())).build();
    }

    private static AuthenticatedActor platform() {
        return new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN);
    }

    private static Company company(UUID id, CompanyStatus status) {
        return new Company(id, "Nahui SAC", null, "NAHUI", null, status,
                new CompanySettings("America/Lima", "PEN", 100, 60, 90, null), Instant.EPOCH, Instant.EPOCH, 2);
    }

    private static String validBody() {
        return "{\"legalName\":\"Nahui SAC\",\"code\":\"NAHUI\",\"settings\":{\"timezone\":\"America/Lima\",\"currency\":\"PEN\",\"geofenceRadiusMeters\":100,\"trackingIntervalSeconds\":60}}";
    }
}
